# MVP Definition
# Recipe Scanner App

**Version:** 3.0  
**Status:** Build Complete

## MVP Objective

Validate that scanning/importing a recipe and generating an editable shopping list is meaningfully faster than manual list creation. Additionally validate that AI-powered meal identification can generate usable recipes from food photos.

## In MVP (Implemented)

### Scan Recipe Mode
1. Camera capture flow
2. Photo library import flow
3. Multi-photo support (up to 8 images per recipe)
4. Dual OCR: Tesseract.js on-device + OCR.Space cloud via proxy
5. Rule-based ingredient parser with confidence scoring
6. Ingredient edit mode (add/edit/delete)
7. Save recipe locally (localStorage)
8. Generate persistent shopping checklist
9. Recipe library with history and regenerate list
10. Basic multi-recipe merge from saved recipes

### Identify Meal Mode
11. Photo capture/import of finished dishes
12. GPT-4o Vision meal identification via proxy server
13. AI-generated recipe with ingredients, steps, temperatures, and timing
14. Editable AI output before saving
15. Sample meal for offline testing

### Infrastructure
16. Python proxy server for API calls (OCR.Space, OpenAI)
17. Settings panel (OCR mode toggle, confidence threshold, data reset)

## Not in MVP (Deferred)

1. Advanced fuzzy deduplication
2. Unit conversion system
3. Apple Notes export
4. URL recipe extraction
5. Android-native app

## MVP User Flows

### Flow 1: Scan Recipe
1. Open app → Scan tab
2. Toggle to "Scan Recipe" mode
3. Tap camera/import or use sample recipe
4. (Optional) Add more photos to grid (up to 8)
5. Tap "Extract Ingredients"
6. Review and fix ingredient rows
7. Tap "Save" → shopping checklist generated

### Flow 2: Identify Meal
1. Open app → Scan tab
2. Toggle to "Identify Meal" mode
3. Capture or import photo of a dish
4. Tap "Analyze Meal" (or "Try Sample Meal" for demo)
5. Review generated recipe, ingredients, and steps
6. Tap "Save" → shopping checklist generated

## MVP Acceptance Criteria

- End-to-end Scan Recipe flow completes without errors
- End-to-end Identify Meal flow completes when proxy is running
- List state persists after page reload
- OCR failures show clear user message
- User can edit extraction output before saving
- On-device OCR works without network access
- Meal identification fails gracefully when proxy is unavailable

## Build Evidence

### Web Demo (primary)
- App source: `demo/mobileview/app.js`, `index.html`, `styles.css`
- Proxy server: `scripts/ocr_proxy_server.py`

### Swift Core
- Parser + tests: `Sources/RecipeCore`, `Tests/RecipeCoreTests`
- Fixture runner: `Sources/RecipeCLITest/main.swift`, `fixtures/parser-fixtures.json`
- Test script: `scripts/run-cli-tests.ps1`, `scripts/run-cli-tests.sh`

### iOS App (secondary)
- App source: `ios/RecipeScannerApp/Sources`
