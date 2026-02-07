# Project Context

## Critical Files to Review
- **Market Fit & MVP**: `recipe-app-market-fit.md` — Contains market analysis, customer fit assessment, competitive landscape, and phased MVP roadmap
- **Product Requirements**: `aiDocs/prd.md` — Detailed product requirements document (to be created)
- **MVP Definition**: `aiDocs/mvp.md` — Scope and boundaries for minimum viable product (to be created)
- **Architecture**: `aiDocs/architecture.md` — System design and technical architecture (to be created)
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
- OCR accuracy target: 95%+ field accuracy (name, quantity, unit)
- Target scan-to-list time: <15 seconds
- User should be able to fix OCR errors in <10 seconds
- Multi-recipe with overlap detection is the core differentiator
- Phase 1 includes lightweight multi-recipe preview (2-3 recipes, exact match duplicates)
- Unit conversions removed from MVP entirely — add only if validated need
- Apple Notes export is Phase 3 — validate the core loop first

## Current Focus
Building an AI-powered iOS recipe scanner that converts physical cookbook recipes into structured shopping lists. Phase 1 MVP includes single-recipe workflow PLUS lightweight multi-recipe preview (2-3 recipes with basic exact-match duplicate detection) to tease the power of the full multi-recipe feature coming in Phase 2.
