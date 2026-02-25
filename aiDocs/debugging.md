# Debugging Workflow

## Web Demo Debugging

The web demo (`demo/mobileview/`) is debugged using browser DevTools:

1. Open `http://localhost:5500/demo/mobileview/` in Chrome/Edge
2. Open DevTools (F12) → Console tab for errors and logs
3. Application tab → Local Storage to inspect persisted state
4. Network tab to verify proxy requests to `localhost:8765`

### Common Web Demo Issues

1. **OCR returns no text**: Check console for Tesseract.js errors. Try cloud OCR (toggle in Settings, requires proxy).
2. **Proxy unreachable**: Verify `python scripts/ocr_proxy_server.py` is running on port 8765. Check `/health` endpoint.
3. **Meal identification fails**: Confirm `OPENAI_API_KEY` env var is set. Check proxy console for 401/429 errors.
4. **429 rate limit**: Proxy has built-in retry with exponential backoff (3 attempts). Wait and retry if all attempts fail.
5. **Stale state**: Reset from Settings tab or clear localStorage manually.

## Proxy Server Debugging

The proxy (`scripts/ocr_proxy_server.py`) logs to stdout:

1. Check that required env vars are set: `OCR_SPACE_API_KEY`, `OPENAI_API_KEY`
2. Test health: `curl http://localhost:8765/health`
3. Watch stdout for request logs and API error responses
4. If port 8765 is in use, kill stale processes and restart

## iOS App Logging (Secondary)

Structured logging in the iOS app:

- Implementation: `ios/RecipeScannerApp/Sources/Services/AppLogger.swift`
- Log file: `Documents/logs/app-log.jsonl`
- Events: `state_loaded`, `ocr_started`, `ocr_completed`, `ocr_failed`, `recipe_saved`

## CLI Test Scripts

1. `scripts/run-cli-tests.ps1`
2. `scripts/run-cli-tests.sh`

Both scripts run:

1. `swift test`
2. `swift run RecipeCLITest --fixtures fixtures/parser-fixtures.json`

## Test-Log-Fix Loop

1. Reproduce issue with fixture or manual scan
2. Run parser tests
3. Inspect logs/console for event sequence and confidence metadata
4. Patch parser or state logic
5. Re-run tests and confirm no regression

## Example Debug Scenarios

1. OCR returns no text
- Check browser console for Tesseract.js errors
- Try cloud OCR via proxy
- Validate user-facing fallback message shown

2. Parser drops too many lines
- Add failing fixture
- Adjust line filters/token parsing
- Re-run CLI fixtures

3. Meal AI returns wrong recipe
- Check proxy console for GPT-4o response
- Verify image quality and format
- Try with sample meal to confirm proxy works
