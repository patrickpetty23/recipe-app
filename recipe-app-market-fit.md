# Recipe Scanning App: Market Fit Assessment & MVP

## The Idea
An AI-powered recipe scanner that converts any recipe (starting with physical cookbooks) into a clean, organized shopping list.

**Core Value Prop:** *"I tell the app what I'm cooking, it tells me exactly what to buy."*

---

## Market Fit Assessment

### Market Size
| Segment | Size | Notes |
|---------|------|-------|
| US Home Cooks | ~60-70% of adults cook at home regularly | Large TAM |
| Physical Cookbook Sales | ~$400M annually (still growing) | Niche but durable |
| Meal Planning Apps | Growing 15%+ YoY, multi-billion market | Validated demand |
| iPhone Ownership | ~50% of US smartphone users | Platform alignment |

**Verdict:** ✅ Niche but defensible market. Not massive, but solvable and monetizable.

### Customer Fit

**Target Persona:**
- Cooks 3+ times/week
- Frustrated by creating manual shopping lists
- Wants to reduce food waste from over-buying
- Already uses phone for meal planning/notes

**Pain Points Solved:**
1. **Manual entry is tedious** — typing out every ingredient
2. **Measurement confusion** — "2 cups flour" = how many bags?
3. **Cross-recipe overlap** — realizing you need garlic for 3 different dishes

**Riskiest Assumptions:**
1. OCR accuracy is reliable enough for regular use
2. Users will trust and use AI-extracted ingredient lists
3. The app workflow fits naturally into their cooking routine

### Competitive Landscape
- **Manual note-taking** — primary incumbent (free, familiar)
- **Paprika / Mela** — digital-first recipe apps with manual entry
- **AnyList / Out of Milk** — grocery-first apps with recipe features
- **Google Lens / Apple Live Text** — can OCR but no recipe logic

**Your Moat:** Recipe-optimized OCR + structured ingredient extraction. The bundle matters.

---

## MVP Sketch

### Phase 1: Core MVP (4-6 weeks)
**Single Recipe → Shopping List**

1. **Camera Scan** — Point camera at recipe page, capture image
2. **OCR + Parse** — Extract ingredients and format as clean list (95% field accuracy target)
3. **Edit Mode** — Let user fix any extraction errors
4. **Multi-Recipe Preview** — Prompt to scan another recipe, basic merge with exact-match duplicates
5. **Shopping List** — Save to app's internal shopping list
6. **Checklist View** — Simple checkbox UI for grocery shopping

**Success Metrics:**
- 95%+ field accuracy (name, quantity, unit) on common cookbook formats
- <15s from scan → editable list
- User can fix errors in <10 seconds
- Multi-recipe preview successfully merges 2-3 recipes
- User completes at least 1 shopping trip with the list

---

### Phase 2: Multi-Recipe (Core Value) (4-5 weeks)
**The Real Differentiator**

- [ ] Full multi-recipe workflow — expand beyond Phase 1 preview
- [ ] Advanced fuzzy duplicate detection — "garlic clove" vs "garlic"
- [ ] Better merge UI with conflict resolution
- [ ] Recipe library improvements — search, tags, categories

**Why This Matters:**
Phase 1 previews multi-recipe to hook users early. Phase 2 goes from "neat trick" to "can't live without it" with full multi-recipe workflow, advanced fuzzy matching, and better UX.

---

### Phase 3: Export & More Inputs (2-3 weeks)
**Nice-to-Haves**

- [ ] Unit conversions (only if validated need — moved from Phase 2)
- [ ] Export to Apple Notes (via Share Sheet/Shortcuts)
- [ ] Screenshot parsing (online recipes)
- [ ] URL support (paste link → auto-fetch ingredients)
- [ ] Manual text entry

**Why These Wait:**
Unit conversions require complex database and aren't core value (users can read raw measurements). Apple Notes is distribution, not core value. Online recipes are expansion, not beachhead. Prove the core loop first.

---

### Phase 4: Advanced (Only If Validated)
**Maybe Never Needed**

- [ ] Smart conversions (recipe → exact package sizes)
- [ ] Store-specific suggestions
- [ ] Meal planning calendar
- [ ] Price tracking

---

## Technical Stack

| Component | Suggested Tech |
|-----------|----------------|
| Platform | iOS (SwiftUI) |
| OCR | Apple's Vision framework (on-device) or OpenAI GPT-4 Vision |
| Parsing | Rule-based parser + small LLM for edge cases |
| Data Storage | SwiftData (local first) |
| Backend | Minimal to start — Firebase/Supabase only when needed |

---

## Assignment Answers

### 1. Market Fit Assessment
- Target market is viable but niche (~5-10M potential users in US)
- Key risks: OCR quality, user trust in AI extraction, workflow fit
- Competitive differentiation is clear but execution-dependent

### 2. MVP Sketch
- **V1:** Single recipe → camera scan → editable list → in-app shopping checklist
- **V2:** Multi-recipe with merge + overlap detection
- **V3:** Export to Apple Notes, online recipe inputs
- **Philosophy:** Prove the core loop, then expand

### Why This MVP Validates the Business
Phase 1 proves **"does scanning work?"**
Phase 2 proves **"is this 10x better than manual?"**

If users don't find value in Phase 1, Phase 2 won't save you. If they love Phase 1, Phase 2 is where they become paying customers.
