# RecipeScanner iOS App

This folder contains the SwiftUI app source for the iOS implementation. The primary runnable demo is the web app at `demo/mobileview/` — this iOS app requires macOS + Xcode to build.

Workflow:
1. Capture/import recipe image
2. Run on-device OCR (Vision)
3. Parse ingredients
4. Edit ingredients
5. Save recipe and generate a shopping checklist

## Build Options

### Option A: XcodeGen (fastest)

1. Install XcodeGen (`brew install xcodegen`).
2. From `ios/RecipeScannerApp`, run:
   ```bash
   xcodegen generate
   ```
3. Open `RecipeScannerApp.xcodeproj`.
4. Choose an iPhone simulator and run.

### Option B: Manual Xcode project

1. Create a new iOS App project in Xcode (SwiftUI, iOS 17+).
2. Add all files from `ios/RecipeScannerApp/Sources`.
3. Add local Swift package dependency to repository root (`Package.swift`) so `RecipeCore` is available.
4. Ensure `Info.plist` contains:
   - `NSCameraUsageDescription`
   - `NSPhotoLibraryUsageDescription`

## Notes

- Core parser and merge logic is in the shared package target `RecipeCore`.
- Persistence is local-first (JSON + local image files in app Documents directory).
- Structured logs are written to `Documents/logs/app-log.jsonl`.
- Cloud fallback is intentionally stubbed and disabled by default.
