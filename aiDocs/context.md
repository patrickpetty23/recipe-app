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
- **Recipe Library**: Browse saved recipes, view details and cooking steps, regenerate shopping lists.
- **Shopping List**: Persistent checklist with progress ring. Merge all recipes into one list.
- **Settings**: Toggle cloud vs on-device OCR, adjust confidence threshold, reset data.

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
- Endpoints: `POST /ocr`, `POST /analyze-meal`, `GET /health`
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

## Definition of Done

- Web demo runs from `python -m http.server 5500` on any OS.
- End-to-end flow works: scan/import → OCR → edit → save → shopping list.
- Identify Meal flow works when proxy is running with valid OpenAI key.
- Parser tests and fixtures run from CLI (Swift toolchain required).
- Documentation reflects real implementation status.
