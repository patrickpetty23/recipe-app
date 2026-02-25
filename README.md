# Recipe Scanner App

A recipe scanner that converts recipe photos and screenshots into editable shopping lists. Features two modes: **Scan Recipe** (multi-photo OCR extraction) and **Identify Meal** (AI-powered dish recognition with full recipe generation).

## Quick Start (Web Demo)

The primary runnable app is the web demo at `demo/mobileview/`. It runs in any browser on any OS and displays in an iPhone-style phone frame.

1. Start a static server from repo root:
   ```
   python -m http.server 5500
   ```
2. Open `http://localhost:5500/demo/mobileview/` in your browser.
3. Click **"Try with Sample Recipe"** to test instantly — no setup needed.

### Enable Cloud OCR + Meal Identification (optional)

Start the proxy server in a second terminal:

```powershell
python scripts/ocr_proxy_server.py
```

Requires environment variables:
- `OCR_SPACE_API_KEY` — for cloud OCR fallback (better accuracy than on-device)
- `OPENAI_API_KEY` — for meal identification via GPT-4o Vision
- `OPENAI_PROJECT_ID` — OpenAI project scoping (optional)

Without the proxy, the demo falls back to Tesseract.js (in-browser OCR). Meal identification requires the proxy.

## Features

- **Scan Recipe**: Camera capture, photo import, or sample recipe. Supports up to 8 photos per recipe with combined OCR.
- **Identify Meal**: Take or import a photo of a finished dish. GPT-4o Vision identifies the meal and generates a full recipe with steps, temperatures, and measurements.
- **Parse & Edit**: Ingredient extraction with quantity/unit/name parsing, confidence scoring, inline editing.
- **Recipe Library**: Browse saved recipes, view details and steps, regenerate shopping lists.
- **Shopping List**: Check off items, progress ring, merge all recipes into one list.
- **Settings**: Toggle cloud/on-device OCR, adjust confidence threshold, reset data.
- **Persistence**: All data saved in localStorage across sessions.

## Repository Structure

- `demo/mobileview/`: primary web demo (HTML/CSS/JS)
- `demo/desktop-app/`: earlier desktop mirror demo
- `scripts/ocr_proxy_server.py`: Python proxy server for OCR.Space and OpenAI APIs
- `ios/RecipeScannerApp/`: iOS SwiftUI app source (requires macOS + Xcode)
- `Sources/RecipeCore/`: shared Swift parser + merge core
- `Tests/RecipeCoreTests/`: Swift unit tests
- `fixtures/`: parser fixture data
- `scripts/`: CLI test scripts and proxy server
- `aiDocs/`: PRD, architecture, roadmap, rubric docs
- `presentation/`: midterm presentation assets

## iOS App (macOS + Xcode only)

The iOS app in `ios/RecipeScannerApp/` is the original Swift implementation. It requires macOS with Xcode to build and is not the primary demo artifact.

## Run Swift CLI Tests

```bash
swift test
swift run RecipeCLITest --fixtures fixtures/parser-fixtures.json
```

PowerShell:

```powershell
./scripts/run-cli-tests.ps1
```
