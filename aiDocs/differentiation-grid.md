# 2×2 Differentiation Grid
## Recipe Scanning & Shopping List App — Pre-MVP Research

**Date:** February 2026

---

### Grid: Recipe Input Effort vs. Shopping Output Intelligence

**Why these axes**

The PRD's competitive framing focuses on OCR capability — we scan, others don't. That's true but it's an internal frame. The more useful frame for positioning is how much work the user has to do to get a recipe in, and how useful the output actually is when they're standing in the store. Those are the two things that came up most across the interviews.

- **X-axis: Recipe Input Effort** — from high friction (manual typing) to low friction (scan or paste)
- **Y-axis: Shopping Output Intelligence** — from a raw ingredient dump to a structured, actionable list (merged, deduped, quantity-aware)

---

```
                      HIGH OUTPUT INTELLIGENCE
                  (Merged, deduped, actionable list)
                                │
                                │
      [This app — Phase 2]      │    [Instacart / grocery apps
      Camera scan + multi-      │     with recipe import]
      recipe merge, fuzzy       │     Cart auto-population,
      dedup, clean organized    │     aisle organization, pricing —
      list. Moderate input      │     but locked to their
      friction.                 │     store ecosystem.
                                │
HIGH ─────────────────────────  ┼  ───────────────────────────── LOW
FRICTION                        │                           FRICTION
(Manual entry)                  │                    (URL / auto-import)
                                │
      [Paprika / Mela]          │    [This app — Phase 1]
      Manual recipe entry,      │     Camera or screenshot scan,
      solid library features,   │     basic single-recipe list,
      weak shopping output.     │     no merge or dedup yet.
      Strong on organization,   │     Low input effort,
      not on the grocery trip.  │     limited output intelligence.
                                │
                      LOW OUTPUT INTELLIGENCE
                       (Raw ingredient dump)
```

---

### Quadrant by quadrant

**Top-Left: High Friction, High Intelligence** — *This app at Phase 2*

After Phase 2 ships, this is where the app sits. Scanning a physical cookbook is still more effort than pasting a URL — that friction is real. But the output quality (merged lists, fuzzy deduplication, shared ingredient flags across recipes) is meaningfully more useful than anything a general-purpose tool produces. The position is defensible: cookbook users are already holding the book, the scan is a small additional step, and recipe-specific intelligence is hard to replicate without purpose-built logic.

**Top-Right: Low Friction, High Intelligence** — *Instacart and grocery-native apps*

Grocery apps with recipe import can auto-populate a cart and organize by aisle — but only within their own store ecosystem, and they're not built around physical cookbooks or user-uploaded screenshots. This quadrant is the long-term threat. If a well-resourced player (a major grocery chain, Google, or a large recipe platform) builds a URL-to-smart-cart experience that also handles screenshots well, they'd land here and commoditize the position. Reason to build a moat in the physical cookbook niche before competing on digital breadth.

**Bottom-Left: High Friction, Low Intelligence** — *Paprika, Mela, and similar recipe managers*

Manual entry for everything, and what you get back is a recipe library — not a smart shopping list. Strong on organization, weak on the grocery trip. These apps win users who want a digital cookbook collection. Different job to be done; not a direct competitor.

**Bottom-Right: Low Friction, Low Intelligence** — *This app at Phase 1*

Where the app launches. Low friction (scan instead of type) but limited output — single recipe, no merge, no dedup, no quantity intelligence. This quadrant is a beachhead, not a destination. The Phase 1 value proposition is: less work than typing, good enough for one recipe. That's not a defensible long-term position, which is exactly why Phase 2 is not optional — it's what moves the app into a quadrant worth owning.

---

### Skeptic's note

The X-axis conflates two different kinds of friction: the effort to get the recipe *in*, and the effort to *verify the output*. A camera scan is low friction to start but higher friction to trust if users end up cross-checking the result anyway. Manual entry into Paprika is high friction to start but zero friction to trust — you typed it yourself.

If the X-axis were redrawn as total friction including verification, the Phase 1 position slides back toward the center. That's a problem worth sitting with rather than explaining away.
