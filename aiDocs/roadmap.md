# Implementation Roadmap
# Recipe Scanning & Shopping List App

**Version:** 1.0  
**Date:** February 23, 2026  
**Status:** In Review  
**Target:** 6 weeks, solo iOS developer

---

## Constraints

- No multi-recipe features (Phase 2 only)
- No unit conversions
- No backend or cloud sync
- LLM fallback (GPT-4 Vision) is optional and off by default
- Camera capture AND photo library import supported from day one
- Core features must work fully offline (Vision framework is on-device)

---

## Week 1: Project Setup, Camera Integration & UI Shell

### Xcode Project & Architecture
- [ ] Create new Xcode project (SwiftUI, iOS 17+ deployment target, iPhone only)
- [ ] Set up folder structure: `Views/`, `Services/`, `Models/`, `Managers/`, `Utilities/`
- [ ] Add `Info.plist` entries for `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription`
- [ ] Create `AppState.swift` with `@Observable` class containing `currentRecipe`, `scannedRecipes`, `shoppingList`, `isScanning`, `showEditMode` properties
- [ ] Create `ContentView.swift` as root view with tab/navigation structure for CameraView, EditModeView, and ShoppingListView

### Camera Capture
- [ ] Create `CameraView.swift` with live AVCaptureSession camera preview layer
- [ ] Add capture button that takes a still photo and stores it as `UIImage`
- [ ] Implement basic auto-capture: detect stable frame using `AVCaptureVideoDataOutput` and trigger capture after ~1 second of stability (optional, can stub)
- [ ] Request camera permissions on first launch with clear rationale text

### Photo Library Import
- [ ] Integrate `PHPickerViewController` (or SwiftUI `PhotosPicker`) in CameraView for photo library import
- [ ] Accept `.images` only; filter to screenshots and photos
- [ ] Convert selected `PHPickerResult` to `UIImage` using the same pipeline as camera capture
- [ ] Verify imported images from TikTok screenshots, website screenshots, and Instagram screenshots load correctly

### UI Shell (Placeholder Screens)
- [ ] Create placeholder `EditModeView.swift` with static ingredient list
- [ ] Create placeholder `ShoppingListView.swift` with static checklist
- [ ] Implement basic navigation: CameraView → EditModeView → ShoppingListView
- [ ] Apply consistent styling: system fonts, Dynamic Type support, safe area insets

### Week 1 Checkpoint
- [ ] **Go/No-Go:** Camera preview displays correctly and capture produces a clear `UIImage`
- [ ] **Go/No-Go:** Photo library picker opens, user selects an image, and it loads into the same preview as camera capture
- [ ] **Go/No-Go:** Tapping through CameraView → EditModeView → ShoppingListView navigation works end-to-end

---

## Week 2: OCR Integration & Ingredient Extraction Pipeline

### OCRService
- [ ] Create `OCRService.swift` as `@Observable` class with `func extractText(from image: UIImage) async throws -> OCRResult`
- [ ] Implement `VNRecognizeTextRequest` with `.accurate` recognition level and `usesLanguageCorrection = true`
- [ ] Create `OCRResult` struct with `rawText: String`, `confidence: Float`, `boundingBox: CGRect?`
- [ ] Create `OCRError` enum with cases `imageProcessingFailed`, `noTextDetected`, `visionFrameworkError(Error)`
- [ ] Return per-line confidence scores from `VNRecognizedText.confidence`

### Image Preprocessing
- [ ] Implement `preprocessImage(_ image: UIImage) -> CGImage` in OCRService
- [ ] Add contrast enhancement using `CIFilter` (e.g., `CIColorControls`)
- [ ] Add automatic orientation correction via `UIImage.imageOrientation`
- [ ] Test preprocessing on both camera photos (natural lighting) and screenshots (crisp digital text)

### IngredientParser (Basic)
- [ ] Create `IngredientParser.swift` as `@Observable` class
- [ ] Create `ParsedIngredient` struct with `name`, `quantity`, `unit`, `confidence`, `originalLine`
- [ ] Implement `parse(_ ocrText: String) -> [ParsedIngredient]` that splits text into lines
- [ ] Add regex pattern for standard format: `(quantity) (unit) (name)` — e.g., "2 cups flour", "1/4 tsp salt"
- [ ] Add `commonUnits` list: cup, cups, tbsp, tsp, oz, lb, lbs, g, kg, ml, l
- [ ] Handle lines with no quantity/unit (treat full line as ingredient name, confidence 0.7)
- [ ] Implement `calculateConfidence()` that boosts score for recognized units and penalizes malformed quantities

### Wire Pipeline Together
- [ ] Connect CameraView capture → OCRService.extractText() → IngredientParser.parse() → display results in EditModeView
- [ ] Show loading spinner during OCR processing
- [ ] Display overall OCR confidence score on EditModeView
- [ ] Handle OCRError cases: show user-facing alert for no text detected, retry option for low confidence

### Week 2 Checkpoint
- [ ] **Go/No-Go:** Photograph a clean cookbook page → OCR extracts readable text with ≥70% confidence
- [ ] **Go/No-Go:** Import a TikTok/Instagram recipe screenshot → OCR extracts readable text
- [ ] **Go/No-Go:** IngredientParser correctly splits "2 cups flour" into quantity="2", unit="cups", name="flour"

---

## Week 3: Edit Mode, Data Models & SwiftData Setup

### SwiftData Models
- [ ] Create `Recipe.swift` `@Model` class with `id` (UUID), `name`, `createdAt`, `imageData` (optional Data), `ingredients` array, `isArchived` flag
- [ ] Create `Ingredient.swift` `@Model` class with `id` (UUID), `name`, `quantity` (optional String), `unit` (optional String), `rawText` (optional String), `recipe` (parent reference)
- [ ] Create `ShoppingList.swift` `@Model` class with `id` (UUID), `createdAt`, `items` array, `sourceRecipeIDs`
- [ ] Create `ShoppingListItem.swift` `@Model` class with `id` (UUID), `ingredient` reference, `isChecked` flag
- [ ] Configure `ModelContainer` in the App entry point with all four model types
- [ ] Verify SwiftData schema compiles and app launches without migration errors

### RecipeManager
- [ ] Create `RecipeManager.swift` with CRUD operations: `saveRecipe()`, `fetchRecipes()`, `deleteRecipe()`
- [ ] Implement `createRecipeFromParsedIngredients(_ parsed: [ParsedIngredient], image: UIImage?) -> Recipe`
- [ ] Store original captured/imported image as compressed JPEG Data (80% quality) on the Recipe

### Edit Mode (Full Implementation)
- [ ] Replace placeholder EditModeView with functional ingredient list bound to `[Ingredient]`
- [ ] Tap any ingredient row to inline-edit name, quantity, and unit fields
- [ ] Add "Delete" swipe action to remove an ingredient row
- [ ] Add "Add Ingredient" button at the bottom that inserts a blank row for manual entry
- [ ] Add "Save to Shopping List" button that converts ingredients to ShoppingListItems and navigates forward
- [ ] Display confidence indicator per ingredient (green ≥ 0.8, yellow 0.5–0.8, red < 0.5) based on parser confidence

### Pipeline Integration
- [ ] After OCR + parsing, automatically create a Recipe object and navigate to EditModeView with live data
- [ ] Edits in EditModeView update the Ingredient models in-place via SwiftData
- [ ] Saving persists the Recipe to SwiftData so it appears in recipe history

### Week 3 Checkpoint
- [ ] **Go/No-Go:** Scan a recipe → edit an ingredient name and quantity → save → Recipe persists in SwiftData across app relaunch
- [ ] **Go/No-Go:** User can add a missing ingredient and delete a junk line in under 10 seconds
- [ ] **Go/No-Go:** Confidence indicators display correctly (green/yellow/red) based on parser output

---

## Week 4: Shopping List View, Recipe Storage & State Management

### ShoppingListManager
- [ ] Create `ShoppingListManager.swift` with `generateList(from recipe: Recipe) -> ShoppingList`
- [ ] Implement `toggleItem(_ item: ShoppingListItem)` to flip `isChecked`
- [ ] Implement `clearAll()` to reset all items or delete the active list
- [ ] Persist ShoppingList and ShoppingListItems in SwiftData

### Shopping List View (Full Implementation)
- [ ] Replace placeholder ShoppingListView with functional checklist bound to `ShoppingList.items`
- [ ] Each row shows ingredient name, quantity, and unit with a leading checkbox
- [ ] Tapping a row toggles `isChecked` with strikethrough styling and visual dimming
- [ ] Add "Clear All" button with confirmation alert
- [ ] Shopping list state survives app close and relaunch (SwiftData persistence)
- [ ] Show empty state with prompt to scan a recipe when no list exists

### Recipe Storage & History
- [ ] Create `RecipeListView.swift` showing saved recipes sorted by `createdAt` descending
- [ ] Each row displays recipe name, date, and ingredient count
- [ ] Tapping a saved recipe opens it in EditModeView (read-only or editable)
- [ ] Add swipe-to-delete on recipe rows
- [ ] Add "Re-generate Shopping List" action from a saved recipe

### App State & Navigation Polish
- [ ] Finalize `AppState` transitions: scanning → editing → shopping list
- [ ] Add tab bar or navigation flow: Camera | Recipes | Shopping List
- [ ] Ensure back navigation works cleanly at every step
- [ ] Handle edge case: user cancels during scan (return to CameraView without saving partial data)
- [ ] Handle edge case: user scans while a shopping list already exists (offer to replace or keep)

### Week 4 Checkpoint
- [ ] **Go/No-Go:** Full flow works end-to-end: capture/import → OCR → edit → save → shopping list with checkboxes
- [ ] **Go/No-Go:** Close the app, reopen → shopping list items and their checked state persist
- [ ] **Go/No-Go:** Saved recipes appear in recipe history and can regenerate a shopping list

---

## Week 5: Bug Fixes, Edge Cases, LLM Fallback & Performance

### Edge Case Handling
- [ ] Test and handle: blurry/out-of-focus photos → show "Image too blurry, please retake" message
- [ ] Test and handle: image with no detected text → show "No recipe text found" with retry and manual entry options
- [ ] Test and handle: OCR returns confidence < 70% → show warning banner with suggestion to retake or edit carefully
- [ ] Test and handle: very long ingredient lists (20+ items) → verify scroll performance in EditModeView and ShoppingListView
- [ ] Test and handle: unusual characters (fractions like ½, ¼, accented letters) in OCR output → parse correctly or gracefully degrade
- [ ] Test and handle: recipe name detection — attempt to extract a recipe title from the top of the scanned text, fallback to "Untitled Recipe"

### LLM Fallback (Optional Feature)
- [ ] Create `LLMFallbackService.swift` with `func extractIngredients(from image: UIImage) async throws -> [ParsedIngredient]`
- [ ] Integrate OpenAI GPT-4 Vision API: send image, receive structured ingredient JSON
- [ ] Add Settings toggle: "Use AI Cloud Extraction" (off by default) with privacy disclosure text
- [ ] Wire fallback trigger: when OCRService confidence < 70% AND setting is enabled, offer user the option to send to GPT-4 Vision
- [ ] Show clear indicator when image is being sent off-device ("Sending to cloud for better extraction...")
- [ ] Handle API errors gracefully: network unavailable, rate limit, timeout → fall back to on-device results

### Performance Optimization
- [ ] Profile OCR pipeline: measure time from image capture to parsed ingredients displayed (target: <15 seconds)
- [ ] Add image compression before storing: JPEG 80% quality, cap resolution at 2048px on longest edge
- [ ] Implement debouncing on auto-capture to prevent rapid repeated OCR calls
- [ ] Verify app cold start time is under 2 seconds on iPhone 12+
- [ ] Lazy-load recipe images in RecipeListView (only decode when scrolled into view)
- [ ] Cap stored recipe history at 50 most recent; add cleanup logic for old recipes

### Accessibility
- [ ] Verify all interactive elements have accessibility labels
- [ ] Test VoiceOver navigation through the full scan → edit → shopping list flow
- [ ] Confirm Dynamic Type scales text correctly in all views without layout breakage

### Week 5 Checkpoint
- [ ] **Go/No-Go:** All identified edge cases handled with clear user-facing messages (no crashes, no silent failures)
- [ ] **Go/No-Go:** Scan-to-list pipeline completes in under 15 seconds on a real device
- [ ] **Go/No-Go:** App works fully offline with no network calls during the core scan → edit → list flow (LLM fallback excluded)

---

## Week 6: Real-World Testing, User Feedback & Iteration

### Cookbook Testing (Physical)
- [ ] Test with at least 5 different physical cookbooks (varied fonts, layouts, paper colors)
- [ ] Test with a handwritten recipe card — document expected failure and verify graceful error message
- [ ] Test with angled/rotated photos (15°–30° off-axis) — verify OCR still extracts usable text
- [ ] Test under poor lighting conditions (dim kitchen, overhead shadows) — document accuracy drop-off
- [ ] Test with a two-column cookbook layout — verify parser handles or gracefully skips non-ingredient text

### Digital Screenshot Testing
- [ ] Test with at least 3 TikTok recipe screenshots (text overlaid on video still, varied fonts)
- [ ] Test with at least 3 Instagram recipe screenshots (story format, post format, carousel)
- [ ] Test with at least 3 website recipe screenshots (blog-style with ads/headers, clean recipe cards)
- [ ] Test with a Pinterest recipe screenshot
- [ ] Document which screenshot types work well with Vision OCR vs. which would benefit from LLM fallback

### Accuracy Measurement
- [ ] Create a test set of 10 recipes (5 cookbook, 5 screenshot) with manually verified ground-truth ingredients
- [ ] Run each through the pipeline and score: % of fields (name, quantity, unit) extracted correctly
- [ ] Calculate overall field accuracy — target ≥ 90% on clean inputs
- [ ] Identify the top 3 failure patterns (e.g., fractions, multi-word units, decorative fonts) and log as issues

### User Testing
- [ ] Recruit 2-3 real users (friends, family, classmates who cook)
- [ ] Observe them complete the full flow: open app → scan a recipe → edit → shop with list
- [ ] Time the flow: target < 30 seconds from app open to usable shopping list
- [ ] Collect feedback using the validation questions from mvp.md (would you use this? what's frustrating? what's missing?)
- [ ] Document at least 3 actionable improvements based on user feedback

### Iteration & Polish
- [ ] Fix the top 3 bugs discovered during testing
- [ ] Improve the top 1-2 UX pain points identified by users
- [ ] Final pass on visual polish: consistent spacing, color scheme, empty states, loading states
- [ ] Verify all error messages are user-friendly (no raw error codes or technical jargon)

### Week 6 Checkpoint
- [ ] **Go/No-Go:** Field accuracy measured at ≥ 90% on the 10-recipe test set
- [ ] **Go/No-Go:** At least 1 user completed a real shopping trip using the app-generated list
- [ ] **Go/No-Go:** No crashes observed during all testing sessions

---

## MVP Validation

### Must Pass (Go/No-Go for Launch)

_From `aiDocs/mvp.md` — all must be checked before considering MVP complete._

- [ ] User can scan a recipe and generate a shopping list in < 30 seconds
- [ ] OCR extracts ≥ 90% of fields correctly (name, quantity, unit) on clean cookbook pages and digital screenshots
- [ ] User can fix extraction errors in < 10 seconds using Edit Mode
- [ ] User completes at least 1 actual shopping trip using the app-generated list
- [ ] App works fully offline (no internet required for core scan → edit → list features)

### Validation Questions (Ask Users After 1 Week of Use)

- Would you use this every time you cook?
- How does this compare to your current workflow?
- What was frustrating?
- What's missing that you actually need?
- Did you trust the extracted list without double-checking everything?

---

## What's NOT in This Roadmap (Phase 2+)

| Feature | Phase |
|---------|-------|
| Multi-Recipe Preview & Merge | Phase 2 |
| Advanced duplicate detection (fuzzy matching) | Phase 2 |
| Unit conversions | Phase 3+ |
| Apple Notes export | Phase 3 |
| URL auto-extraction (no screenshot) | Phase 3 |
| Cloud sync | Phase 2+ |
| Recipe categories / tags | Phase 2+ |

---

## Related Documents

- **PRD:** `aiDocs/prd.md`
- **MVP Definition:** `aiDocs/mvp.md`
- **Architecture:** `aiDocs/architecture.md`
- **Context:** `aiDocs/context.md`
- **Coding Style:** `aiDocs/coding-style.md` (to be created)
