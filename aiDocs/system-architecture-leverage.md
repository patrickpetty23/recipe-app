# System Architecture: Problem, Leverage Points, and Target

## Problem Node in the Larger System

The core bottleneck is the manual translation layer between "recipe source" and "grocery execution."

```text
Recipe Content -> (Manual Translation Bottleneck) -> Shopping List -> Grocery Trip
```

That bottleneck causes time loss, omissions, and duplicated cognitive effort each week.

## System Architecture View

```text
┌───────────────────────────────────────────────────────────────┐
│                     External System Context                  │
├───────────────────────────────────────────────────────────────┤
│ Recipe Sources: cookbooks, social screenshots, recipe blogs  │
│ Grocery Execution: in-store checklist use                    │
└───────────────┬───────────────────────────────────────────────┘
                │ input
                v
┌───────────────────────────────────────────────────────────────┐
│                   Recipe Scanner Solution                    │
├───────────────────────────────────────────────────────────────┤
│ 1) Capture/import                                             │
│ 2) OCR extraction                                             │
│ 3) Ingredient parsing                                         │
│ 4) Fast human correction                                      │
│ 5) Persistent shopping checklist                              │
└───────────────┬───────────────────────────────────────────────┘
                │ output
                v
          Faster, more reliable grocery execution
```

## Identified Leverage Points

| Leverage Point | Why It Matters | Current Implementation |
|----------------|----------------|------------------------|
| LP1: OCR quality on noisy inputs | Impacts downstream correction burden | Tesseract.js (on-device) + OCR.Space (cloud) + confidence scoring |
| LP2: Parser precision | Reduces manual cleanup cost | `RecipeCore` parser + tests/fixtures |
| LP3: Edit speed | Converts imperfect OCR into usable output | Inline edit/add/delete in editor view |
| LP4: Checklist persistence | Drives repeat utility in real shopping | Local storage + toggle persistence |

## Where the Solution Targets the System

The product intentionally targets the middle conversion layer:

1. It does not compete on recipe discovery.
2. It does not compete on grocery delivery logistics.
3. It optimizes the "recipe -> usable shopping list" transformation.

That target is high leverage because small improvements produce direct weekly time savings.
