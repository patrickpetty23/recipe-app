# Product Requirements Document (PRD)
# Recipe Scanning & Shopping List App

**Version:** 1.0  
**Date:** February 5, 2026  
**Status:** In Review

---

## 1. Overview

### 1.1 Product Summary
An AI-powered iOS application that enables users to capture recipes from physical cookbooks or import screenshots from any digital source (TikTok, websites, Instagram, etc.) and automatically generate structured shopping lists with intelligent merging, duplicate detection, and measurement conversion.

### 1.2 Value Proposition
**"I tell the app what I'm cooking, it tells me exactly what to buy."**

The app eliminates the tedious manual process of:
- Copying ingredients from recipe books or screenshots
- Converting measurements to grocery packaging
- Cross-referencing shared ingredients across multiple recipes

### 1.3 Target Users
- iPhone users who cook from physical cookbooks or digital recipes 3+ times per week
- Users who save or screenshot recipes from TikTok, Instagram, websites, or other digital sources
- Busy professionals and families who meal-plan
- Users frustrated by creating manual shopping lists
- People looking to reduce food waste from over-buying

---

## 2. Problem Statement

### 2.1 Current Pain Points
1. **Manual entry is tedious** — Typing out every ingredient from a cookbook is time-consuming
2. **Measurement confusion** — "2 cups flour" doesn't match grocery packaging; users waste time calculating
3. **Cross-recipe overlap** — Users don't realize they need garlic for 3 different dishes until they're in the store

### 2.2 Why Existing Solutions Fall Short
- **Manual note-taking** — Free but entirely manual, no automation
- **Paprika / Mela** — Require manual digital recipe entry
- **AnyList / Out of Milk** — Grocery-first, weak recipe scanning
- **Google Lens / Apple Live Text** — Can OCR but no recipe-specific logic

---

## 3. Requirements

### 3.1 Core Features (MVP - Phase 1)

#### Single Recipe → Shopping List
1. **Camera Scanning**
   - Native iOS camera integration for physical cookbook photos
   - Automatic capture on stable frame detection
   - Photo library import for screenshots from any digital source (TikTok, websites, Instagram, etc.)

2. **OCR & Ingredient Extraction**
   - Use Apple Vision framework (on-device for speed/privacy)
   - Extract ingredient names, quantities, and units
   - Support common cookbook formats (ingredient lists, inline ingredients)
   - **Target: 90% field accuracy** (name, quantity, unit extracted correctly)

3. **Structured Output**
   - Display ingredients in clean, organized list format
   - Group by category (optional MVP+)
   - Maintain original quantities

4. **Edit Mode**
   - Simple UI for quickly fixing OCR errors
   - Add/remove/edit ingredients
   - Edit quantities and units

5. **Shopping List View**
   - Checkbox UI for grocery shopping
   - Persistent state (saved locally)
   - Clear markers for completed items

### 3.2 Phase 2: Multi-Recipe (Core Differentiator)

1. **Full Multi-Recipe Workflow**
   - Multi-recipe preview and merge (scan additional recipes, combine ingredients)
   - Scan and organize 5+ recipes
   - View individual recipe lists
   - Combine into master shopping list with better UX

2. **Advanced Smart Merge & Deduplication**
   - Fuzzy matching for duplicate detection ("garlic clove" vs "garlic")
   - Merge quantities intelligently with conflict resolution
   - Visual indicators for shared ingredients
   - Handle measurement inconsistencies

3. **Recipe Library Improvements**
   - Save scanned recipes for re-use
   - Search/filter saved recipes
   - Tagging and categorization system
   - Recipe collections/folders

### 3.3 Phase 3: Expansion

1. **Unit Conversions** (Moved from Phase 2)
   - Convert recipe measurements to standard grocery sizes
   - Example: "2 cups flour" → "1 (5 lb) bag flour"
   - Database of common ingredient-to-package mappings
   - Only add if validated user need

2. **Export to Apple Notes**
   - Share sheet integration
   - Export as formatted checklist

3. **Online Recipe Support**
   - URL input for supported recipe sites (auto-extraction without screenshot)

4. **Manual Entry**
   - Text input for recipes that won't scan

### 3.4 Phase 4: Advanced (Validated Need Only)

1. **Smart Conversions**
   - Precise package size calculations
   - Store-specific suggestions

2. **Meal Planning Dashboard**
   - Calendar integration
   - Weekly meal planning view

3. **Price Tracking**
   - Integration with grocery APIs (future)

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **OCR Accuracy:** 90%+ field accuracy (name, quantity, unit) on common cookbook formats and digital screenshots
- **Scan-to-List Time:** <15 seconds from capture to editable list
- **Edit Mode:** User can fix errors in <10 seconds
- **App Launch:** <2 seconds cold start

### 4.2 Quality
- **Reliability:** App should handle poor lighting, angled text, varied fonts
- **Error Handling:** Clear messaging when scanning fails
- **Offline Support:** Core functionality works without internet (Vision framework is on-device)

### 4.3 Privacy
- All OCR and initial processing happens on-device
- Recipe data stored locally by default
- Optional cloud sync only with explicit user consent

### 4.4 Accessibility
- Support Dynamic Type
- VoiceOver compatibility
- High contrast mode support

---

## 5. Success Metrics

### 5.1 MVP Success Criteria
- User completes at least 1 shopping trip with app-generated list
- 90%+ OCR field accuracy in real-world testing
- User retention: 50%+ return within 1 week

### 5.2 Product-Market Fit Indicators
- Users scan 3+ recipes per week
- Users report time saved vs. manual entry
- Organic referrals/word-of-mouth
- Willingness to pay (subscriptions, one-time purchase)

---

## 6. Constraints & Assumptions

### 6.1 Constraints
- **Platform:** iOS only (iPhone, iPad secondary)
- **Apple Notes API:** Limited official API; may require Shortcuts workaround
- **OCR Limitations:** Handwritten recipes, heavily stylized fonts, and low-resolution screenshots may fail

### 6.2 Assumptions
- Users have iPhones with cameras capable of clear recipe photos
- Users who save or screenshot digital recipes will benefit from structured extraction
- Ingredient extraction accuracy will be "good enough" for MVP (users can edit)
- Unit conversion database can be built incrementally (start with top 50 ingredients)

---

## 7. Out of Scope (Explicitly NOT in MVP)

- Web scrapers for recipe sites via URL (legal complexity, maintenance burden)
- Recipe discovery/search functionality
- Social features (sharing recipes, community)
- Nutrition information extraction
- Step-by-step cooking instructions
- Video recipe support
- Android version
- Meal prep timing/scheduling
- Integration with grocery delivery services (Instacart, etc.)

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OCR accuracy insufficient for 90% target | Medium | High | Build robust edit mode; iterate on Vision framework config; add GPT-4 Vision fallback; allow user feedback to improve model |
| Users don't trust AI extraction | Medium | High | Show confidence indicators; make editing frictionless |
| Apple Notes integration too limited | Medium | Medium | Build strong in-app list first; Notes is Phase 3 anyway |
| Digital screenshots vary widely in layout/quality | Medium | Medium | LLM fallback (GPT-4 Vision) for complex layouts; robust edit mode as safety net |

---

## 9. Open Questions

1. What percentage of target users actually struggle with ingredient copying vs. just doing it manually?
2. Will users trust AI-generated lists without verifying every item?
3. Is Apple Notes integration actually desired, or do users prefer in-app lists?
4. How important is unit conversion vs. just showing raw recipe amounts?
5. What's the tolerance for OCR errors (1 per recipe? 3 per recipe?)

---

## 10. Related Documents

- **Market Fit Assessment:** `recipe-app-market-fit.md`
- **MVP Definition:** `aiDocs/mvp.md`
- **Architecture:** `aiDocs/architecture.md`
- **Coding Style:** `aiDocs/coding-style.md`
