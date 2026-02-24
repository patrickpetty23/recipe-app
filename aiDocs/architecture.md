# Architecture Document
# Recipe Scanning & Shopping List App

**Version:** 1.0  
**Date:** February 6, 2026  
**Status:** Draft

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    iOS App (SwiftUI)                    │
├─────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────┐ │
│  │  Camera   │  │   Edit    │  │   Shopping List     │ │
│  │   View    │→ │   Mode    │→ │       View          │ │
│  └───────────┘  └───────────┘  └─────────────────────┘ │
│         ↓              ↓                   ↓            │
│  ┌─────────────────────────────────────────────────┐   │
│  │           State Management Layer                │   │
│  │         (@Observable, @State)                   │   │
│  └─────────────────────────────────────────────────┘   │
│         ↓              ↓                   ↓            │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────┐ │
│  │    OCR    │  │  Recipe   │  │    Shopping List    │ │
│  │  Service  │  │  Manager  │  │       Manager       │ │
│  └───────────┘  └───────────┘  └─────────────────────┘ │
│         ↓              ↓                   ↓            │
│  ┌─────────────────────────────────────────────────┐   │
│  │         SwiftData Persistence Layer             │   │
│  │    (Recipe, Ingredient, ShoppingList models)    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Core Components

| Component | Responsibility |
|-----------|---------------|
| **CameraView** | Capture recipe images via camera (physical cookbooks) or photo library import (digital screenshots from TikTok, websites, Instagram, etc.), preview, trigger OCR |
| **OCRService** | Vision framework integration, image preprocessing, text extraction |
| **IngredientParser** | Parse OCR text into structured ingredients (name, quantity, unit) |
| **RecipeManager** | CRUD operations for recipes, multi-recipe merging |
| **ShoppingListManager** | Generate and manage shopping lists from recipes |
| **SwiftData Models** | Persistent storage for recipes, ingredients, lists |

---

## 2. Data Models

### 2.1 Core Models (SwiftData)

```swift
@Model
class Recipe {
    @Attribute(.unique) var id: UUID
    var name: String
    var createdAt: Date
    var imageData: Data?  // Optional: store original photo
    var ingredients: [Ingredient]
    var isArchived: Bool = false
    
    init(name: String = "Untitled Recipe") {
        self.id = UUID()
        self.name = name
        self.createdAt = Date()
        self.ingredients = []
    }
}

@Model
class Ingredient {
    @Attribute(.unique) var id: UUID
    var name: String
    var quantity: String?  // e.g., "2", "1/4", "2-3"
    var unit: String?      // e.g., "cups", "tbsp", "lbs"
    var rawText: String?   // Original OCR text for debugging
    var recipe: Recipe?    // Parent recipe
    
    init(name: String, quantity: String? = nil, unit: String? = nil, rawText: String? = nil) {
        self.id = UUID()
        self.name = name
        self.quantity = quantity
        self.unit = unit
        self.rawText = rawText
    }
}

@Model
class ShoppingList {
    @Attribute(.unique) var id: UUID
    var createdAt: Date
    var items: [ShoppingListItem]
    var sourceRecipeIDs: [UUID]  // Track which recipes contributed
    
    init() {
        self.id = UUID()
        self.createdAt = Date()
        self.items = []
        self.sourceRecipeIDs = []
    }
}

@Model
class ShoppingListItem {
    @Attribute(.unique) var id: UUID
    var ingredient: Ingredient
    var isChecked: Bool = false
    var mergedFrom: [UUID] = []  // Track which ingredients were merged (for multi-recipe)
    
    init(ingredient: Ingredient) {
        self.id = UUID()
        self.ingredient = ingredient
    }
}
```

### 2.2 Supporting Types (Non-Persisted)

```swift
struct OCRResult {
    let rawText: String
    let confidence: Float  // 0.0 to 1.0
    let boundingBox: CGRect?
}

struct ParsedIngredient {
    let name: String
    let quantity: String?
    let unit: String?
    let confidence: Float
    let originalLine: String
}

enum OCRError: Error {
    case imageProcessingFailed
    case noTextDetected
    case visionFrameworkError(Error)
}

enum ParsingError: Error {
    case invalidFormat
    case ambiguousQuantity
}
```

---

## 3. OCR Pipeline

### 3.1 Flow

```
Image Capture → Preprocessing → Vision OCR → Text Extraction → Parsing → Structured Data
```

### 3.2 OCRService Implementation

```swift
@Observable
class OCRService {
    func extractText(from image: UIImage) async throws -> OCRResult {
        // 1. Preprocess image (enhance contrast, correct orientation)
        let processedImage = preprocessImage(image)
        
        // 2. Vision framework text recognition
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        
        let handler = VNImageRequestHandler(cgImage: processedImage, options: [:])
        try handler.perform([request])
        
        // 3. Extract text with confidence scores
        guard let observations = request.results else {
            throw OCRError.noTextDetected
        }
        
        let recognizedText = observations
            .compactMap { $0.topCandidates(1).first }
            .map { ($0.string, $0.confidence) }
        
        return OCRResult(
            rawText: recognizedText.map(\.0).joined(separator: "\n"),
            confidence: recognizedText.map(\.1).reduce(0, +) / Float(recognizedText.count),
            boundingBox: nil
        )
    }
    
    private func preprocessImage(_ image: UIImage) -> CGImage {
        // TODO: Implement image enhancement
        // - Increase contrast
        // - Correct rotation/perspective
        // - Remove noise
        return image.cgImage!
    }
}
```

### 3.3 IngredientParser

```swift
@Observable
class IngredientParser {
    private let commonUnits = ["cup", "cups", "tbsp", "tsp", "oz", "lb", "lbs", "g", "kg", "ml", "l"]
    
    func parse(_ ocrText: String) -> [ParsedIngredient] {
        let lines = ocrText.components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        
        return lines.compactMap { line in
            parseIngredientLine(line)
        }
    }
    
    private func parseIngredientLine(_ line: String) -> ParsedIngredient? {
        // Regex patterns for common ingredient formats:
        // "2 cups flour"
        // "1/4 tsp salt"
        // "3 large eggs"
        // "garlic cloves, minced"
        
        // Pattern: (quantity) (unit) (ingredient name)
        let pattern = #"^([\d\/.]+)\s*([a-zA-Z]+)?\s*(.+)$"#
        
        guard let regex = try? NSRegularExpression(pattern: pattern, options: []),
              let match = regex.firstMatch(in: line, range: NSRange(line.startIndex..., in: line)) else {
            // No quantity/unit detected, assume entire line is ingredient name
            return ParsedIngredient(
                name: line,
                quantity: nil,
                unit: nil,
                confidence: 0.7,
                originalLine: line
            )
        }
        
        let quantity = (line as NSString).substring(with: match.range(at: 1))
        let unit = match.range(at: 2).location != NSNotFound 
            ? (line as NSString).substring(with: match.range(at: 2))
            : nil
        let name = (line as NSString).substring(with: match.range(at: 3))
        
        return ParsedIngredient(
            name: name.trimmingCharacters(in: .whitespaces),
            quantity: quantity,
            unit: unit,
            confidence: calculateConfidence(quantity: quantity, unit: unit, name: name),
            originalLine: line
        )
    }
    
    private func calculateConfidence(quantity: String?, unit: String?, name: String) -> Float {
        var score: Float = 0.8  // Base confidence
        
        // Increase confidence if unit is recognized
        if let unit = unit, commonUnits.contains(unit.lowercased()) {
            score += 0.1
        }
        
        // Decrease confidence if quantity looks weird
        if let quantity = quantity, quantity.contains(where: { !($0.isNumber || $0 == "/" || $0 == ".") }) {
            score -= 0.2
        }
        
        return min(1.0, max(0.0, score))
    }
}
```

### 3.4 LLM Fallback (GPT-4 Vision)

When the Vision framework OCR confidence falls below 70%, the image can optionally be sent to the GPT-4 Vision API for extraction. This provides a second-pass extraction path that is especially useful for:

- **Digital screenshots** (TikTok, websites, Instagram) with complex layouts, overlays, or non-standard formatting that the rule-based parser struggles with
- **Stylized cookbook pages** with decorative fonts or unusual ingredient list structures
- **Low-confidence Vision results** where the on-device OCR is uncertain

**Configuration:**
- LLM fallback is an **optional, user-configurable** feature (off by default)
- Users can enable it in Settings; the app should clearly indicate when an image will be sent off-device
- When enabled, fallback triggers automatically when Vision confidence < 70%

**Privacy Note:** Sending images to the GPT-4 Vision API means recipe images leave the device and are processed by OpenAI's servers. The app must clearly disclose this to the user before enabling the feature, and should never send images off-device without explicit user consent.

---

## 4. UI Architecture

### 4.1 View Hierarchy

```
ContentView (Root)
├── CameraView
│   ├── Camera preview layer
│   ├── Capture button
│   └── Gallery picker
├── EditModeView
│   ├── Ingredient list (editable)
│   ├── Add/Remove buttons
│   └── Save to shopping list
└── ShoppingListView
    ├── Checklist UI
    ├── Check/uncheck items
    └── Clear/reset buttons
```

### 4.2 State Management

```swift
@Observable
class AppState {
    var currentRecipe: Recipe?
    var scannedRecipes: [Recipe] = []
    var shoppingList: ShoppingList?
    var isScanning: Bool = false
    var showEditMode: Bool = false
}
```

---

## 5. Storage Layer (SwiftData)

### 5.1 Schema Design

- **Recipe** → one-to-many → **Ingredient**
- **ShoppingList** → one-to-many → **ShoppingListItem**
- **ShoppingListItem** → references → **Ingredient**

### 5.2 Queries

```swift
// Fetch all recipes
@Query(sort: \Recipe.createdAt, order: .reverse) var recipes: [Recipe]

// Fetch active shopping list
@Query(filter: #Predicate<ShoppingList> { !$0.isArchived }) var activeList: [ShoppingList]
```

---

## 6. Error Handling

### 6.1 OCR Failures

- **Low confidence (<70%)**: Show warning banner; if LLM fallback is enabled, offer to send to GPT-4 Vision; allow user to retry
- **No text detected**: Prompt user to adjust lighting/angle
- **Vision framework error**: Fallback to manual entry option

### 6.2 Parsing Errors

- **Ambiguous quantity**: Show user the uncertain field, ask for clarification
- **Unrecognized format**: Store raw text, let user edit manually

---

## 7. Performance Considerations

### 7.1 Optimization Strategies

- **On-device OCR**: No network latency, works offline
- **Lazy loading**: Load recipe images only when needed
- **Debouncing**: Prevent rapid repeated OCR calls during camera adjustment
- **Caching**: Cache parsed ingredients to avoid re-parsing on app restart

### 7.2 Memory Management

- Store images as compressed Data (JPEG 80% quality)
- Limit recipe history to 50 most recent (configurable)
- Clear checked shopping list items after 24 hours (optional)

---

## 8. Testing Strategy

### 8.1 Unit Tests

- IngredientParser regex patterns
- Merge logic (duplicate detection)
- Quantity combination logic

### 8.2 Integration Tests

- OCR → Parse → Save pipeline
- Multi-recipe merge flow
- Shopping list state persistence

### 8.3 Manual Testing

- Test with real cookbooks (varied fonts, layouts)
- Edge cases: handwritten recipes, angled photos, poor lighting
- Performance: OCR speed on older devices (iPhone 12+)

---

## 9. Future Architecture Considerations (Post-MVP)

### 9.1 Phase 2: Multi-Recipe Merge Logic

Exact-match duplicate detection and basic quantity merging for combining ingredients across multiple scanned recipes.

```swift
@Observable
class RecipeManager {
    func mergeRecipes(_ recipes: [Recipe]) -> [Ingredient] {
        var mergedIngredients: [String: Ingredient] = [:]
        
        for recipe in recipes {
            for ingredient in recipe.ingredients {
                let key = ingredient.name.lowercased().trimmingCharacters(in: .whitespaces)
                
                if let existing = mergedIngredients[key] {
                    let combinedQuantity = combineQuantities(existing.quantity, ingredient.quantity)
                    existing.quantity = combinedQuantity
                } else {
                    mergedIngredients[key] = ingredient
                }
            }
        }
        
        return Array(mergedIngredients.values).sorted { $0.name < $1.name }
    }
    
    private func combineQuantities(_ q1: String?, _ q2: String?) -> String? {
        guard let q1 = q1, let q2 = q2 else {
            return q1 ?? q2
        }
        return "\(q1) + \(q2)"  // e.g., "2 cups + 1 cup"
    }
}
```

**Phase 2 Enhancements:**
- Fuzzy string matching ("garlic" vs "garlic clove" vs "minced garlic")
- Quantity arithmetic (2 cups + 1 cup = 3 cups)
- Unit normalization (1 tbsp + 3 tsp = 1 tbsp)

### 9.2 Phase 2: Advanced Multi-Recipe
- **Fuzzy matching service** (e.g., Levenshtein distance for ingredient names)
- **Quantity arithmetic engine** (parse "2 1/2 cups" and calculate sums)

### 9.3 Phase 3: Cloud Sync
- **Backend**: Firebase or Supabase for cross-device sync
- **Conflict resolution**: Last-write-wins for shopping list state

### 9.4 Phase 4: Advanced Features
- **ML model**: Custom CoreML model for recipe-specific OCR (trained on cookbook layouts)
- **Grocery store integration**: APIs for price tracking, store inventory

---

## Related Documents

- **PRD:** `aiDocs/prd.md`
- **MVP Definition:** `aiDocs/mvp.md`
- **Context:** `aiDocs/context.md`
- **Coding Style:** `aiDocs/coding-style.md` (to be created)
