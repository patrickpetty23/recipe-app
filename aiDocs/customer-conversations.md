# Customer Conversations
## Recipe Scanning & Shopping List App — Pre-MVP Research

**Date:** February 2026

---

> **Note on methodology:** Three interviews conducted with roommates, ages 22–24. Convenience sample — not randomly recruited, which is a bias worth flagging. Conversations happened at home, pretty casually. Notes taken during/right after. No recording.

---

### Interview #1 — Undergrad, 23
**Profile:** Junior, biology major. Cooks maybe 3x/week, mostly weeknights. Shared kitchen with 3 others. No cookbooks — basically all recipes from TikTok or YouTube.  
**Setting:** Kitchen table, after dinner. ~25 min.

---

**Raw notes**

- current system: saves TikTok videos to a "recipes" collection → scrolls through when deciding what to cook
- saved folder has 200+ videos, "most of them I've never actually made"
- doesn't write shopping lists — figures it out from memory, or opens TikTok in the aisle
- forgot an ingredient recently, had to go back for tahini. laughed it off
- cooks budget stuff — rice dishes, stir fry, pasta. nothing with a long ingredient list
- liked screenshot import more than camera scan when we showed the concept. doesn't own cookbooks
- kept asking if it works on TikTok screenshots specifically — the ones with ingredient text overlaid on the video
- raised: what if the ingredients are in the caption and not on screen — good edge case, hadn't thought of it
- would use it to not forget stuff at the store, not to organize more broadly
- multi-recipe thing landed flat — "i just cook one thing at a time"
- asked if it had dark mode

**The thing that stood out**

Pulled up the TikTok saved folder to show us. Scrolled for a while. Then said — the problem isn't finding the recipe, it's that by the time they're at the store they've already forgotten half the ingredients. Doesn't frame it as a shopping list problem. Frames it as a memory problem. That's a different framing than what the PRD assumes.

**Signals**
- ✅ Screenshot import is the right entry point here, not camera scan
- ✅ Real recurring pain — the "going back to the store" moment
- ⚠️ Recipes are short and simple — may not feel enough friction to justify a new app
- ⚠️ TikTok caption vs. on-screen text is a real OCR edge case
- ❌ No interest in multi-recipe or meal planning — wrong user for the Phase 2 pitch
- ❌ Low recipe complexity — unclear if this represents a high-value use case

---

### Interview #2 — International Student, 22
**Profile:** ELS (English Language Studies) student, from Peru. In the US about 8 months. Cooks almost every day — mostly Peruvian dishes, partly for homesickness. Recipes from memory, WhatsApp voice messages from family, or Spanish-language YouTube. Shops at a Latin grocery nearby and a regular supermarket.  
**Setting:** Living room, laptop open (had been studying). ~35 min.

---

**Raw notes**

- cooks more than anyone else in the apartment — says it's how they deal with being far from home
- no recipe apps — "the apps are all in english and the recipes are not the same"
- main recipe source: family via WhatsApp voice messages, sometimes photos of handwritten cards
- transcribes them by hand into Notes app but it's slow — also translating at the same time
- specific pain: ingredient names don't match what US stores carry — "aji amarillo" isn't always labeled that way here
- went to three stores once for "huacatay" (black mint) — eventually found it at the Latin market under a different label
- biggest friction isn't the scanning, it's knowing what to actually buy in America for a Peruvian recipe
- when we showed concept: curious but skeptical — "does it understand Spanish words?"
- lit up at photo import — already takes photos of handwritten recipe cards over FaceTime
- edit mode resonated — used to fixing things, "at least I can change it"
- US measurements confusing (cups, tablespoons vs. metric) — asked if the app converts
- multi-recipe: actually does cook two or three things for the week — more than the other two interviewees

**The thing that stood out**

Played us a WhatsApp voice message from a parent — about 3 minutes of someone dictating a recipe for aji de gallina. That's the primary recipe format: audio, in Spanish, no visual version. The app doesn't touch that use case at all.

The pain around ingredient substitution and translation is a completely different problem than what the PRD is solving. What's actually needed is something like "aji amarillo = this thing at this kind of store." Way out of scope — but it's the real job to be done here. Worth flagging because this is a user we'd attract through the screenshot/photo import flow and then underserve once they're in.

**Signals**
- ✅ Heavy cook, real recurring pain
- ✅ Already photographs recipes — fits the app's mental model
- ✅ Actually does multi-recipe cooking during the week
- ⚠️ Core pain is ingredient substitution + translation, not list generation — app solves maybe 30% of the problem
- ⚠️ Unit conversion matters more for this user than we'd budgeted for
- ❌ Spanish-language recipes, handwritten cards, voice messages — all out of scope
- ❌ Real churn risk: downloads the app, finds it doesn't solve the real problem, leaves fast

---

### Interview #3 — Grocery Store Manager, 24
**Profile:** Manages produce and general section at a regional grocery chain. Works about 45 hours/week, irregular shifts. Cooks on days off, usually 2–3x/week. Practical about food. Uses a physical notepad for lists — "it's just faster." Shops at own store with employee discount.  
**Setting:** Just home from a closing shift. ~30 min. A little tired.

---

**Raw notes**

- list system: small notepad on the fridge, adds to it throughout the week as things run out
- doesn't really use recipes — cooks things already known cold. stir fry, that kind of thing
- when a recipe is needed it's AllRecipes on the phone, followed live while cooking
- shopping is extremely efficient — knows the store layout, never backtracks, in and out in 15–20 min
- mild reaction to the concept — "sure, that makes sense"
- wasn't sold on camera scan: why point your phone at a book when you can just look at the book
- more interested in screenshot angle — screenshots AllRecipes sometimes when the page is annoying mid-cook
- multi-recipe merge got a real reaction: "I hate when I get home and realize I needed garlic for two things but only grabbed one"
- then caught that thought: "I would've caught that before I left though" — checks the fridge before going in
- unprompted: sees customers every day who come in with handwritten lists and miss things, come back same day — "that's the person who needs this"
- gave us a user persona without being asked: people who cook from big hardcover cookbooks and don't know the store well
- pushed on quantities — from experience, the number one issue is people buying the wrong amount. too little and they come back, too much and it goes bad

**The thing that stood out**

Ended up asking us questions more than we asked them. Good product questions — what happens when a recipe says "1 can" but doesn't say what size. Has seen the downstream failure modes from the retail side. Main point: the app doesn't fix the shopping, it just moves the mistake from "forgot to write it down" to "the app got it wrong." Same outcome, different cause. That's a sharp observation and not wrong.

**Signals**
- ✅ Multi-recipe duplicate catch resonated — even for a low-recipe cook
- ✅ Quantity confusion is a real, observed pain — seen daily from the other side of the counter
- ⚠️ Own shopping is too optimized — not the target user for themselves
- ⚠️ Core skepticism: app might just shift where the error happens, not eliminate it
- ❌ Doesn't cook from cookbooks — doesn't have the primary use case pain personally
- ❌ "I would've caught that" — the problem feels solved-enough for them

---

### Cross-Interview Synthesis

| | Undergrad (23) | International Student (22) | Store Manager (24) |
|---|---|---|---|
| Recipe source | TikTok screenshots | Family via WhatsApp, memory | AllRecipes, memory |
| Current list system | None / memory | Notes app (translated by hand) | Physical notepad |
| Cook frequency | ~3x/week, simple | ~5–6x/week, complex | ~2–3x/week, familiar dishes |
| Multi-recipe interest | None | Yes — actually does it | Mild |
| Entry point into app | Screenshot import | Photo of handwritten cards | Screenshot / digital |
| Biggest actual pain | Forgetting at the store | Ingredient translation + substitution | Quantity miscalculation (observed in others) |
| Likely early adopter? | Maybe — if screenshot works | Maybe — but app is a partial fit | Unlikely for themselves |

**The pattern across all three:** None use physical cookbooks, which is the PRD's primary use case. All three come in through digital sources and would enter via screenshot or photo import. If the early user base looks like this sample, the camera-scan-a-cookbook feature isn't the hook — screenshot parsing needs to work first and work well.
