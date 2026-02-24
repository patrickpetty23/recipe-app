# MVP Definition
# Recipe Scanning & Shopping List App

**Version:** 1.0  
**Date:** February 5, 2026  
**Status:** In Review

---

## MVP Philosophy

**The goal is to validate: "Does scanning a recipe and creating a shopping list save users time?"**

Everything in this MVP serves that single validation. Everything else waits.

> "If users don't find value in the core loop, fancy features won't fix it."

---

## MVP Scope

### ✅ IN MVP (Phase 1)

#### 1. Single Recipe Scanning
- Point camera at physical cookbook page and tap to capture
- Import photos from library: screenshots from TikTok, websites, Instagram, or any digital recipe source
- Basic auto-capture when frame is stable (optional)

#### 2. OCR & Ingredient Extraction
- Apple Vision framework (on-device)
- Extract ingredient name, quantity, unit
- Support standard ingredient list formatting
- **Target:** 90% field accuracy (name, quantity, unit extracted correctly)

#### 3. Edit Mode
- Simple list view of extracted ingredients
- Tap to edit any field (name, quantity, unit)
- Delete unwanted lines
- Add missing ingredients manually
- **Goal:** Fix errors in <10 seconds

#### 4. Shopping List View
- Clean checklist UI
- Check/uncheck items
- Persistent state (survives app close)
- Clear all / reset for new trip

#### 5. Recipe Storage (Minimal)
- Save scanned recipe to local database
- View list of saved recipes
- Re-open previous recipes

---

## 🚫 EXPLICITLY NOT IN MVP

| Feature | Why It's Out | When It Comes In |
|---------|--------------|------------------|
| Multi-Recipe Preview | Scope creep for initial validation; Phase 2 only | Phase 2 |
| Full multi-recipe workflow | Validate core single-recipe loop first | Phase 2 |
| Advanced duplicate detection | Requires multi-recipe support | Phase 2 |
| Unit conversions | Complex, requires database, not core value | Phase 3+ |
| Apple Notes export | Distribution, not core value | Phase 3 |
| Online recipe support (URL auto-extraction) | Expansion, not validation | Phase 3 |
| Recipe categories/tags | Organization, not core loop | Phase 2+ |
| Cloud sync | Local-first for MVP | Phase 2+ |
| Social sharing | Nice-to-have | Future |
| Shopping history | Analytics, not MVP | Future |
| Price tracking | Complex integration | Phase 4+ |

---

## MVP User Flow

```
1. Open App
   ↓
2. Camera View (point at recipe)
   ↓
3. Capture Photo → OCR Processing
   ↓
4. Edit Mode (review/fix ingredients)
   ↓
5. Save to Shopping List
   ↓
6. Shopping List View (check items while shopping)
```

**Total time goal:** <30 seconds from open to shopping list

---

## MVP Success Criteria

### Must Pass (Go/No-Go)
- [ ] User can scan a recipe and generate a list in <30 seconds
- [ ] OCR extracts ≥90% of fields correctly (name, quantity, unit on clean pages)
- [ ] User can fix extraction errors in <10 seconds
- [ ] User completes at least 1 actual shopping trip using the app
- [ ] App works offline (no internet required for core features)

### Validation Questions (Ask Users After 1 Week)
- Would you use this every time you cook?
- How does this compare to your current workflow?
- What was frustrating?
- What's missing that you actually need?
- Did you trust the extracted list without double-checking everything?

---

## Technical MVP Boundaries

### Keep It Simple
- **Single view architecture** (no complex navigation)
- **Local storage only** (SwiftData)
- **On-device OCR** (Apple Vision, no cloud calls for MVP)
- **Minimal backend** (none for MVP)
- **iPhone-only** (iPad later if validated)

### Decision Log

| Decision | Rationale |
|----------|-----------|
| Single recipe only (no multi-recipe) | Validate core loop before building complexity |
| No Apple Notes export | In-app list is faster to build, tests core value first |
| Local storage only | Faster to build, respects privacy, works offline |
| Vision framework only | On-device, free, fast; add GPT-4 Vision fallback if needed |
| No unit conversion | Prove users want the app before building conversion database |

---

## MVP Timeline Estimate

**Target:** 4-6 weeks for one developer

| Week | Focus |
|------|-------|
| 1 | Project setup, camera integration, basic UI |
| 2 | OCR integration, ingredient extraction |
| 3 | Edit mode, data models, local storage |
| 4 | Shopping list view, polish, testing |
| 5 | Bug fixes, performance, edge cases |
| 6 | User testing, feedback, iteration |

---

## What Happens After MVP

### If MVP Validates (Users Love It)
→ **Phase 2: Full Multi-Recipe**
- Full multi-recipe workflow (not just preview)
- Advanced fuzzy duplicate detection
- Recipe library improvements (search, tags, categories)
- Better merge UI with conflict resolution

### If MVP Fails
→ **Pivot or Kill**
- Why didn't users adopt? (OCR issues? Workflow mismatch? Trust issues?)
- Do we need to change the approach or is the problem not worth solving?
- Don't build Phase 2 until Phase 1 proves value

---

## Related Documents

- **PRD:** `aiDocs/prd.md` — Full product requirements across all phases
- **Context:** `aiDocs/context.md` — Project overview and current focus
- **Market Fit:** `recipe-app-market-fit.md` — Market analysis and competitive landscape
- **Architecture:** `aiDocs/architecture.md` — Technical design
- **Roadmap:** `aiDocs/roadmap.md` — 6-week implementation checklist
