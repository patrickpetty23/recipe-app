# System Understanding

## Ecosystem Diagram

```text
Recipe Sources
(cookbooks, social screenshots, blogs)
            |
            v
      User Capture Step
 (camera or photo library import)
            |
            v
      Recipe Scanner App
  OCR -> Parser -> Edit -> Shopping
            |
            v
      Grocery Execution
   (in-store checklist usage)
            |
            v
     User Outcomes Loop
  time saved, fewer missed items,
  confidence to reuse app weekly
```

## System Goal

Reduce planning friction between finding a recipe and buying ingredients.

## Elements and Relationships

1. Recipe Source Quality affects OCR quality.
2. OCR quality affects edit workload.
3. Edit workload affects user trust and speed.
4. Trust and speed affect repeat usage and retention.

## Leverage Points

1. Improve parser precision on common ingredient formats.
2. Keep edit mode extremely fast and low-friction.
3. Persist history so recurring users avoid rescanning.
4. Keep offline flow reliable to reduce adoption friction.

Detailed leverage-point mapping and solution targeting is documented in:

- `aiDocs/system-architecture-leverage.md`

## Why This Matters for Product Decisions

The app does not need perfect OCR to win. It needs:

1. Good-enough first extraction
2. Fast correction
3. Reliable checklist output

Those are the highest-leverage areas represented in current implementation.
