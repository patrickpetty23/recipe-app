# Architecture Document
# Recipe Scanner App

**Version:** 3.0  
**Status:** Implemented

## 1. System Overview

The app runs as two cooperating components:

```text
┌───────────────────────────────────────────────────────────┐
│              Web Demo (demo/mobileview/)                 │
│                                                           │
│  Scan Recipe Mode   Identify Meal Mode                   │
│   ↓                   ↓                                   │
│  Camera/Import       Camera/Import                       │
│  (multi-photo)       (single photo)                      │
│   ↓                   ↓                                   │
│  Tesseract.js        ──────────────────────┐             │
│  (on-device OCR)                           │             │
│   ↓                                        │             │
│  IngredientParser    ←────── Proxy ─────── ┤             │
│   ↓                   (OCR.Space cloud)    │             │
│  Editor View         ←────── Proxy ─────── ┘             │
│   ↓                   (GPT-4o Vision)                    │
│  Save Recipe                                              │
│   ↓                                                       │
│  Shopping List                                            │
│   ↓                                                       │
│  localStorage                                             │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│         Python Proxy (scripts/ocr_proxy_server.py)       │
│                                                           │
│  POST /ocr          → OCR.Space API                      │
│  POST /analyze-meal → OpenAI GPT-4o Vision API           │
│  GET  /health       → status check                       │
└───────────────────────────────────────────────────────────┘

Shared Swift module (separate from web demo):
- `RecipeCore`: models + parser + shopping list merge logic + fixture runner
```

## 2. Architectural Decisions

1. Browser-first demo
- Decision: Primary runnable app is vanilla HTML/CSS/JS
- Why: Works on any OS without Xcode, ideal for demos and presentations

2. Dual OCR strategy
- Decision: Tesseract.js on-device + OCR.Space cloud via proxy
- Why: On-device works offline; cloud gives better accuracy on noisy images

3. AI meal identification
- Decision: GPT-4o Vision via proxy server for dish recognition
- Why: Generates full recipes with steps, temps, and measurements from a single food photo

4. Multi-photo scanning
- Decision: Up to 8 photos per recipe, combined OCR results
- Why: Recipes often span multiple pages or screenshots

5. Local-first persistence
- Decision: localStorage with versioned key (`recipe-scanner-demo.v5`)
- Why: No backend dependency, instant load, works offline

6. Python proxy for API calls
- Decision: Lightweight HTTP server bridges browser to external APIs
- Why: Avoids CORS issues and keeps API keys server-side

## 3. Component Responsibilities

### Web Demo (`demo/mobileview/`)

**app.js** — Core application logic:
- State management (scan mode, recipes, shopping list, settings)
- OCR orchestration (Tesseract.js on-device, OCR.Space via proxy)
- Meal analysis flow (image capture → proxy → recipe generation)
- Multi-photo grid management (up to 8 images)
- Ingredient parsing with confidence scoring
- Shopping list merge across recipes
- localStorage persistence

**index.html** — App shell:
- iPhone-style phone frame (390×844px)
- Tab navigation (Scan, Recipes, Shopping, Settings)
- Mode toggle (Scan Recipe / Identify Meal)
- Modal sheets for recipe detail and editing

**styles.css** — iOS-inspired styling:
- SF Pro typography, iOS color palette
- Tab bar, navigation bars, card layouts
- Step cards, temperature badges, photo grid

### Proxy Server (`scripts/ocr_proxy_server.py`)
- POST `/ocr` — forwards images to OCR.Space API
- POST `/analyze-meal` — sends food photos to GPT-4o Vision, returns structured recipe JSON
- GET `/health` — status check
- Retry logic with exponential backoff on 429 rate limits
- Reads API keys from environment variables only (no hardcoded secrets)

### RecipeCore (Swift, `Sources/RecipeCore/`)
- `IngredientParser` — line cleanup, quantity/unit/name parsing, fraction normalization
- `ShoppingListBuilder` — merge duplicates across recipes
- `DomainModels` — shared data structures
- `ParserFixture` — fixture-driven test runner

### iOS App (`ios/RecipeScannerApp/`)
- Original Swift/SwiftUI implementation (requires macOS + Xcode)
- Uses Apple Vision OCR (separate from web demo's OCR pipeline)

## 4. Data Flow

### Scan Recipe Mode
1. User captures/imports up to 8 photos
2. Each photo → Tesseract.js (on-device) or OCR.Space (cloud via proxy)
3. Combined OCR text → ingredient parser
4. Parsed ingredients shown in editor with confidence scores
5. User edits → save recipe → generate shopping list → localStorage

### Identify Meal Mode
1. User captures/imports one photo of a finished dish
2. Image sent to proxy `/analyze-meal` endpoint
3. GPT-4o Vision returns: dish name, ingredients with quantities, cooking steps with temps/times
4. Result shown in editor for review
5. User edits → save recipe → generate shopping list → localStorage

## 5. Environment Variables

| Variable | Purpose | Required For |
|----------|---------|-------------|
| `OCR_SPACE_API_KEY` | OCR.Space cloud API | Cloud OCR fallback |
| `OPENAI_API_KEY` | OpenAI API access | Meal identification |
| `OPENAI_PROJECT_ID` | OpenAI project scoping | Meal identification (optional) |

All keys read from environment only — no hardcoded values in source.

## 6. Error Handling Strategy

1. OCR returns no text → retake photo guidance
2. Proxy unreachable → fall back to Tesseract.js (Scan mode); show error (Meal mode)
3. GPT-4o rate limited (429) → automatic retry with exponential backoff (3 attempts)
4. Parser outputs empty list → manual correction prompt
5. localStorage full/unavailable → graceful degradation warning

## 7. Testability Strategy

- Swift parser tested in `RecipeCoreTests`
- Fixture-driven regression via CLI target
- Web demo testable in any browser with DevTools
- Proxy server has `/health` endpoint for status checks

## 8. Known Limitations

1. Meal identification requires proxy server and OpenAI API key
2. Multi-recipe merge uses normalized exact matching, not fuzzy semantic matching
3. Web demo persistence is browser-local, not synced across devices
4. iOS app is separate codebase with its own OCR pipeline (Apple Vision)

## 9. Problem Target and Leverage Fit

This architecture targets the translation bottleneck: `recipe source → structured grocery list`.

Most leveraged components:

1. OCR pipeline (first-pass extraction quality)
2. Ingredient parser (structure quality)
3. Editor view (human correction speed)
4. Shopping list + persistence (real-world execution reliability)
5. Meal identification (zero-text recipe generation from food photos)

Full system-level mapping: `aiDocs/system-architecture-leverage.md`
