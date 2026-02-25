# Mobile View Demo

The primary runnable app for the Recipe Scanner project. Runs in any browser on any OS and displays in an iPhone-style phone frame (390×844px).

## Quick Start

1. From repo root, start a static HTTP server:
   ```
   python -m http.server 5500
   ```
2. Open in your browser:
   ```
   http://localhost:5500/demo/mobileview/
   ```
3. Click **"Try with Sample Recipe"** to test instantly — no setup needed.

## Proxy Setup (optional, for cloud OCR + meal identification)

Start the proxy server in a second terminal:
```powershell
python scripts/ocr_proxy_server.py
```

Requires environment variables:
- `OCR_SPACE_API_KEY` — cloud OCR (better accuracy than on-device)
- `OPENAI_API_KEY` — meal identification via GPT-4o Vision
- `OPENAI_PROJECT_ID` — OpenAI project scoping (optional)

Without the proxy, the demo falls back to Tesseract.js (in-browser OCR). Meal identification requires the proxy.

## Features

### Scan Recipe Mode
- Camera capture, photo import, or built-in sample recipe
- **Multi-photo support**: up to 8 photos per recipe with combined OCR
- Ingredient extraction with quantity/unit/name parsing and confidence scoring
- Review, add, delete, and fix ingredients before saving

### Identify Meal Mode
- Take or import a photo of a finished dish
- GPT-4o Vision identifies the meal and generates a full recipe
- Returns ingredients with quantities, cooking steps with temperatures and timing
- Built-in sample meal for offline demo/testing

### Core Features
- **Recipe Library**: Browse saved recipes, view details and cooking steps, regenerate shopping lists
- **Shopping List**: Check off items, progress ring, merge all recipes into one list
- **Settings**: Toggle cloud/on-device OCR, adjust confidence threshold, reset data
- **Persistence**: All data saved in localStorage across sessions

## Files

- `index.html` — App shell with phone frame and tab navigation
- `styles.css` — iOS-inspired styling (~1050 lines)
- `app.js` — Complete application logic (~1700 lines)
