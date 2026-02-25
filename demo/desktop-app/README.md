# Desktop Demo App

An earlier desktop-layout demo that mirrors the recipe scanning workflow. For the latest full-featured demo, use `demo/mobileview/` instead — it includes multi-photo scanning, meal identification, and cooking steps.

This demo supports:

1. Scan/import recipe image
2. OCR extraction (multi-pass Tesseract OCR with preprocessing)
3. Ingredient parsing and confidence scoring
4. Edit/add/delete ingredient rows
5. Save recipe and generate shopping list
6. Persist recipe library, shopping list state, and settings locally
7. Show extraction metrics (parsed lines, dropped lines, quantity/unit coverage, quality score)

## Run

From repository root:

```powershell
python -m http.server 5500
```

Open:

```text
http://localhost:5500/demo/desktop-app/
```

## Notes

- Use `demo/mobileview/` for the primary demo with all current features.
- Data persists in browser `localStorage`.
- This demo does not include Identify Meal mode or multi-photo scanning.
