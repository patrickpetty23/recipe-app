# Coding Style Guide
# Recipe Scanner App

## Swift Conventions

1. Use `struct` for value models and small view components.
2. Use `final class` for services/view models with identity/lifecycle.
3. Keep files scoped to one primary type whenever possible.
4. Favor explicit names (`processSelectedImage`) over generic names (`handleData`).
5. Prefer composition over large monolithic views.

## State Management

1. `AppViewModel` is the orchestration boundary.
2. UI logic belongs in SwiftUI views; business logic belongs in `RecipeCore` or services.
3. Any persistent state changes must flow through store save methods.

## Error Handling

1. Surface user-facing actionable errors for OCR failures.
2. Log technical detail via structured logs.
3. Do not swallow errors silently except in logger internals.

## Logging Rules

1. Use event-style names (`ocr_started`, `recipe_saved`).
2. Attach lightweight key-value metadata.
3. Avoid sensitive user data in log metadata.

## Parser Rules

1. Add regression tests before parser behavior changes.
2. Keep fixture updates in `fixtures/parser-fixtures.json`.
3. Ensure quantity and unit parsing degrades gracefully instead of failing hard.

## JavaScript Conventions (Web Demo)

1. Use `const` by default; `let` only when reassignment is needed.
2. Keep rendering functions pure — read state, return/update DOM.
3. Use descriptive function names (`renderScanMode`, `runMealAnalysis`).
4. All state in a single `state` object with `saveState()` for persistence.

## Python Conventions (Proxy Server)

1. Read API keys from environment variables only — never hardcode secrets.
2. Use `http.server` for simple HTTP handling.
3. Add retry logic with exponential backoff for external API calls.

## Documentation Rules

1. Keep docs implementation-accurate.
2. Mark deferred work explicitly instead of implying completion.
