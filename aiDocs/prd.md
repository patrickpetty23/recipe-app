# Product Requirements Document (PRD)
# Recipe Scanner + Shopping List

**Version:** 3.0  
**Status:** Active (implementation-aligned)

## 1. Product Summary

An app that converts recipe photos/screenshots into an editable shopping list, and identifies meals from food photos to generate full recipes with cooking steps.

Primary value statements:

> "I scan what I'm cooking, then shop from a ready checklist."  
> "I snap a photo of a dish, and get the full recipe instantly."

## 2. Users and Jobs

### Target User
- Cooks 2+ times/week
- Uses cookbook pages, saved recipe screenshots, or photos of dishes
- Wants faster grocery list prep with less manual typing

### Primary Jobs To Be Done
1. "When planning a meal, help me turn recipe ingredients into a usable grocery checklist quickly and accurately."
2. "When I see a dish I want to make, help me get the recipe and ingredients list from a photo."

## 3. Problem Statement

Users waste time copying ingredient lists manually. Generic OCR tools extract text but do not create structured, editable shopping lists with persistence. When users see a dish they want to recreate, there is no fast path from a food photo to a shopping list.

## 4. Scope

## 4.1 Implemented Features

### Scan Recipe Mode
1. Image Intake
- Capture from camera
- Import from photo library
- Multi-photo support (up to 8 images per recipe, combined OCR)

2. OCR
- On-device: Tesseract.js v5 (runs in browser)
- Cloud fallback: OCR.Space API via proxy server
- Confidence scoring

3. Ingredient Parsing
- Parse quantity, unit, and ingredient name
- Normalize unicode fractions
- Drop obvious non-ingredient lines
- Confidence-based quality scoring

4. Edit Mode
- Edit ingredient fields inline
- Add ingredient rows manually
- Delete incorrect rows

5. Recipe Persistence
- Save recipe name + ingredient list locally (localStorage)
- View recipe history
- Regenerate shopping list from saved recipe

6. Shopping List
- Generate checklist from recipe
- Toggle completed state with progress ring
- Persist checklist across sessions
- Merge all saved recipes into combined list

### Identify Meal Mode
7. Meal Photo Recognition
- Capture or import photo of a finished dish
- GPT-4o Vision identifies the dish via proxy server
- Returns: dish name, full ingredient list with quantities, cooking steps with temperatures and timing

8. Recipe Generation
- AI-generated recipe displayed in editor for review
- Steps shown with numbered sequence, temperature badges, and time indicators
- User can edit all fields before saving

## 4.2 Out of Scope
- Advanced fuzzy duplicate detection
- Unit conversion engine
- Apple Notes export
- URL-based recipe import
- Android-native production app

## 5. Non-Functional Requirements

1. Performance
- Target scan-to-edit: < 15 seconds on clean images (on-device OCR)
- Target full flow: < 30 seconds to shopping list

2. Reliability
- Graceful handling for no-text OCR cases
- Fallback from cloud to on-device OCR when proxy unavailable
- Retry with exponential backoff on API rate limits (429)

3. Privacy
- On-device OCR by default (no data sent externally)
- Cloud OCR and meal AI require explicit proxy setup
- No API keys stored in source code

## 6. Success Metrics

### Validation Metrics
- OCR extraction usable on cookbook and screenshot test set
- User can correct OCR mistakes in < 10 seconds for common errors
- Meal identification returns accurate recipe for common dishes
- At least one complete shopping trip completed from generated list

### Product-Market Metrics (Future)
- Weekly retained users
- Recipes scanned per active user per week
- Meal identifications per active user
- Self-reported time saved vs manual method

## 7. Risks and Mitigations

1. OCR quality variance across layouts
- Mitigation: dual OCR (on-device + cloud), confidence warnings, fast edit mode

2. Parser misses edge-case formats
- Mitigation: fixture-driven parser tests and iterative updates

3. Meal AI accuracy
- Mitigation: AI output always editable, sample meal for offline testing

4. API rate limits / costs
- Mitigation: exponential backoff retry, on-device OCR as default

## 8. Traceability to Code

### Web Demo (primary)
- App logic: `demo/mobileview/app.js`
- UI structure: `demo/mobileview/index.html`
- Styling: `demo/mobileview/styles.css`
- Proxy server: `scripts/ocr_proxy_server.py`

### Swift Core
- Parser: `Sources/RecipeCore/IngredientParser.swift`
- List merge: `Sources/RecipeCore/ShoppingListBuilder.swift`
- Tests: `Tests/RecipeCoreTests/IngredientParserTests.swift`

### iOS App (secondary)
- App flow: `ios/RecipeScannerApp/Sources/ViewModels/AppViewModel.swift`
- OCR service: `ios/RecipeScannerApp/Sources/Services/OCRService.swift`
- UI: `ios/RecipeScannerApp/Sources/Views/*`

## 9. Related Docs

- `aiDocs/mvp.md`
- `aiDocs/architecture.md`
- `aiDocs/roadmap.md`
- `aiDocs/debugging.md`
- `aiDocs/rubric-deliverables.md`
