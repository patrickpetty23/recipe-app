# Project Context

## Critical Files to Review
- **Market Fit & MVP**: `recipe-app-market-fit.md` — Contains market analysis, customer fit assessment, competitive landscape, and phased MVP roadmap
- **Product Requirements**: `aiDocs/prd.md` — Detailed product requirements document
- **MVP Definition**: `aiDocs/mvp.md` — Scope and boundaries for minimum viable product
- **Architecture**: `aiDocs/architecture.md` — System design and technical architecture
- **Coding Style**: `aiDocs/coding-style.md` — Code conventions and guidelines (to be created)
- **Changelog**: `aiDocs/changelog.md` — Concise change history (to be created)

## Tech Stack
- **Platform**: iOS (SwiftUI)
- **Language**: Swift
- **OCR**: Apple's Vision framework (on-device) or OpenAI GPT-4 Vision
- **Parsing**: Rule-based parser + small LLM for edge cases
- **Data Storage**: SwiftData (local first)
- **Backend**: Minimal to start — Firebase or Supabase only when needed
- **Version Control**: GitHub

## Important Notes
- All recipe parsing must be local-first for privacy and speed
- OCR accuracy target: 90%+ field accuracy (name, quantity, unit)
- Target scan-to-list time: <15 seconds
- User should be able to fix OCR errors in <10 seconds
- Multi-recipe with overlap detection is the core differentiator (Phase 2)
- Unit conversions removed from MVP entirely — add only if validated need
- Apple Notes export is Phase 3 — validate the core loop first

## Current Focus
Building an AI-powered iOS recipe scanner that converts recipes into structured shopping lists. The app accepts both physical cookbook photos (via camera) and screenshots from digital sources (TikTok, websites, Instagram, etc.) via photo library import. Phase 1 MVP focuses on the single-recipe workflow to validate the core scanning-to-shopping-list loop. Multi-recipe features are deferred to Phase 2.
