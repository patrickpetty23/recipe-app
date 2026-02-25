# AI Development Infrastructure

## Repository Pattern

The project follows a document-driven AI workflow:

1. Context and requirements in `aiDocs/`
2. Web demo implementation in `demo/mobileview/`
3. Proxy server in `scripts/ocr_proxy_server.py`
4. Swift core module and iOS app in `Sources/RecipeCore/` and `ios/RecipeScannerApp/`
5. Evidence and iteration notes in `aiDocs/evidence/`

## Required Files Present

- `aiDocs/context.md`
- `aiDocs/prd.md`
- `aiDocs/mvp.md`
- `aiDocs/architecture.md`
- `aiDocs/roadmap.md`
- `aiDocs/coding-style.md`

## MCP and Tooling Notes

1. MCP/tool configuration is user-local (`~/.codex/config.toml`).
2. Repository assumes local MCP availability but does not hard-code secrets.
3. `.gitignore` excludes common sensitive files (`.env`, `.testEnvVars`, `ai/`).

## Git Process Expectations

Recommended branch workflow:

1. `main` protected baseline
2. feature branch per roadmap chunk (`feature/ocr-pipeline`, `feature/edit-mode`)
3. focused commits linked to roadmap checkboxes
4. PR descriptions include test/log evidence references

Current process evidence is indexed in:
- `aiDocs/process-iteration-log.md`
- `aiDocs/evidence/mcp-verification.md`

## Cross-Platform Notes

1. Web demo runs on any OS with a browser (`python -m http.server 5500`).
2. Proxy server requires Python 3 and runs on any OS.
3. iOS app build requires macOS + Xcode.
4. Parser core and tests are pure Swift package targets and can run in CLI environments with Swift installed.
