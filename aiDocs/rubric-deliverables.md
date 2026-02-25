# Rubric Deliverables Map

This document maps repository artifacts to the BYU midterm rubric categories.

## Casey: Technical Process

### 1. PRD and Document-Driven Development
- `aiDocs/prd.md`
- `aiDocs/mvp.md`
- `aiDocs/roadmap.md`

### 2. AI Development Infrastructure
- `aiDocs/context.md`
- `aiDocs/ai-infrastructure.md`
- `aiDocs/mcp-checklist.md`
- `aiDocs/evidence/mcp-verification.md`
- `Package.swift` (shared AI-friendly testable core module boundary)
- `.gitignore` (secrets and local artifacts excluded)
- `ios/RecipeScannerApp/project.yml` (repeatable iOS project generation)

### 3. Phase-by-Phase Implementation
- `aiDocs/roadmap.md` (completed checklists)
- `aiDocs/process-iteration-log.md` (session timeline + plan/implement/review traceability)
- Web demo source in `demo/mobileview/`
- Proxy server: `scripts/ocr_proxy_server.py`
- Swift source in `ios/RecipeScannerApp` + `Sources/RecipeCore`

### 4. Structured Logging and Debugging
- `aiDocs/debugging.md`
- `demo/mobileview/app.js` (structured event log in primary demo)
- `ios/RecipeScannerApp/Sources/Services/AppLogger.swift`
- `scripts/run-cli-tests.ps1`
- `fixtures/parser-fixtures.json`
- `Tests/RecipeCoreTests/IngredientParserTests.swift`

## Jason: Product and System Design

### 1. System Understanding
- `aiDocs/system-understanding.md`
- `aiDocs/system-architecture-leverage.md`
- `aiDocs/architecture.md`

### 2. Problem Identification
- `aiDocs/problem-identification.md`
- `aiDocs/founding-hypothesis.md`
- `aiDocs/falsification-test.md`
- `recipe-app-market-fit.md`

### 3. Customer Focus
- `aiDocs/customer-focus.md`
- `aiDocs/differentiation-2x2.md`
- `recipe-app-market-fit.md`

### 4. Success and Failure Planning
- `aiDocs/success-failure-plan.md`
- `aiDocs/mvp.md`

### 5. Customer Interaction
- `aiDocs/customer-interaction.md`
- `aiDocs/evidence/customer-conversation-u1.md`
- `aiDocs/evidence/customer-conversation-u2.md`
- `aiDocs/evidence/customer-conversation-u3.md`
- `aiDocs/evidence/interview-notes.md`
- `aiDocs/evidence/` (interview and testing artifacts)

## Presentation and Demo Assets

- Primary web demo: `demo/mobileview`
- Proxy server: `scripts/ocr_proxy_server.py`
- iOS app source: `ios/RecipeScannerApp`
- Suggested narrative: `aiDocs/presentation-outline.md`
- PPTX deck: `presentation/RecipeScanner_Midterm_Presentation.pptx`
