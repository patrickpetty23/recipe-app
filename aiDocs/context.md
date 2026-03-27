# Project Context

## Current Product State

This repository contains a recipe scanner app with two runnable implementations:

1. **Web Demo** (primary) — fully functional browser app at `demo/mobileview/`
2. **iOS App** (secondary) — Swift/SwiftUI source at `ios/RecipeScannerApp/` (requires macOS + Xcode)

The web demo is the primary artifact for demonstrations and testing. It runs on any OS in any browser.

### Web Demo Capabilities

- **Scan Recipe mode**: Camera capture, photo import, or built-in sample. Supports up to 8 photos per recipe with combined OCR results.
- **Identify Meal mode**: Take/import a photo of a finished dish. GPT-4o Vision identifies the meal and generates a full recipe with ingredients, steps, temperatures, and timing.
- **Parse & Edit**: Ingredient extraction with quantity/unit/name parsing and confidence scoring. Inline editing before saving.
- **Source-Aware Recipe Drafts**: Recipes now carry source metadata such as import type, source title, source URL, description, and raw import text for future multi-source import flows.
- **URL And Social Draft Import**: Users can paste a recipe or social URL and optionally provide caption/recipe text to create an editable draft without requiring full scraping support yet.
- **Backend-Assisted URL Import**: When the local proxy is running, the web demo now attempts a server-side recipe URL fetch and structured extraction before falling back to a weak draft.
- **Safer Save Flow**: The web demo now warns on likely duplicate recipes before saving.
- **Editable Steps**: Imported or generated cooking steps can now be added, removed, and edited before save.
- **Recipe Library Filtering**: The recipe library now supports search and source-type filtering, with lightweight tags stored on recipes for future organization.
- **Social Import Guidance**: Social URL imports are treated more explicitly as drafts and tagged accordingly so users understand when pasted caption text will improve extraction quality.
- **Weekly Meal Planning**: The web demo now supports a lightweight weekly meal plan, recipe-to-day assignment, and shopping list generation from the current week's plan.
- **Meal Slots**: Weekly planning now supports per-day meal slots (`breakfast`, `lunch`, `dinner`) instead of only one recipe per day.
- **Serving-Aware Planning**: Planned meals can now override servings, and the shopping list scales ingredient quantities from the weekly plan accordingly.
- **Phase 2 Polish**: The planner now supports copying the current week forward, and shopping lists group items into lightweight categories with source recipe context for planned meals.
- **Pantry Foundation**: The web demo now includes manual pantry item management and conservative rule-based shopping hints such as `Likely Have`, `Possibly Low`, `Need`, and `Need Soon`.
- **Recipe Library**: Browse saved recipes, view details and cooking steps, regenerate shopping lists.
- **Shopping List**: Persistent checklist with progress ring. Merge all recipes into one list.
- **Settings**: Toggle cloud vs on-device OCR, adjust confidence threshold, reset data.
- **Blank Recipe Draft Flow**: Users can start a manual recipe draft from the scanner flow and classify the source before saving.

## Repository Map

- `demo/mobileview/`: primary web app (HTML/CSS/JS) — iPhone-style frame, full feature set
- `demo/desktop-app/`: earlier desktop mirror demo (subset of features)
- `scripts/ocr_proxy_server.py`: Python proxy server for OCR.Space and OpenAI APIs
- `ios/RecipeScannerApp/`: iOS SwiftUI app (Apple Vision OCR, separate from web pipeline)
- `Sources/RecipeCore/`: shared Swift parser, ingredient models, shopping list merge logic
- `Tests/RecipeCoreTests/`: Swift unit tests for parser and merge logic
- `fixtures/parser-fixtures.json`: deterministic parser fixtures
- `scripts/`: CLI test scripts (`run-cli-tests.ps1`, `run-cli-tests.sh`) and proxy server
- `aiDocs/`: PRD, architecture, roadmap, debugging, and rubric deliverables

## Technical Implementation

### Web Demo Stack
- **Frontend**: Vanilla HTML/CSS/JS, iOS-inspired design (SF Pro, system colors)
- **On-device OCR**: Tesseract.js v5 (runs in browser, no server needed)
- **Cloud OCR**: OCR.Space API via Python proxy server
- **Meal AI**: OpenAI GPT-4o Vision via Python proxy server
- **Persistence**: Browser localStorage (key: `recipe-scanner-demo.v5`)

### Python Proxy Server
- Runs on `localhost:8765`
- Endpoints: `POST /ocr`, `POST /analyze-meal`, `POST /import-recipe-url`, `POST /decay`, `GET /health`
- Reads API keys from environment variables: `OCR_SPACE_API_KEY`, `OPENAI_API_KEY`, `OPENAI_PROJECT_ID`
- No hardcoded secrets in source code

### iOS App Stack (secondary)
- Platform: iOS 17+ (SwiftUI)
- OCR: Apple Vision framework
- Storage: Local JSON snapshot + image files
- Logging: Structured JSONL app log

## Constraints

- iOS app requires macOS with Xcode to build — web demo is the cross-platform alternative.
- Meal identification requires a running proxy server with a valid OpenAI API key.
- Cloud OCR requires a running proxy server with a valid OCR.Space API key.
- Without the proxy, the web demo falls back to Tesseract.js for OCR. Meal identification is unavailable.
- The web demo now includes pantry management plus pantry-aware shopping hints with quick actions like `Have It`, `Bought`, and `Edit Pantry`.
- The web demo now includes a saved dietary profile, recipe compatibility checks, and basic substitution suggestions in recipe detail.
- The web demo also supports optional manual nutrition metadata on recipes and displays it in recipe detail when provided.
- Recipe cards can now surface lightweight nutrition badges derived from manual values, such as `High Protein` and `Lower Carb`.
- The Predictive Pantry ML flow is now connected to pantry and shopping context via `Predict Runout` and `ML Check` actions, while keeping pantry rules as the primary baseline.
- After an `ML Check`, shopping items can now show an inline ML explanation snippet so the prediction result appears in the shopping context where the user is deciding.

## Definition of Done

- Web demo runs from `python -m http.server 5500` on any OS.
- End-to-end flow works: scan/import → OCR → edit → save → shopping list.
- Identify Meal flow works when proxy is running with valid OpenAI key.
- Parser tests and fixtures run from CLI (Swift toolchain required).
- Documentation reflects real implementation status.
