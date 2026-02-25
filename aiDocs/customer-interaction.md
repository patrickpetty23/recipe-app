# Customer Interaction Evidence Log

## Objective

Collect and document customer evidence on speed, trust, and edit friction for the implemented MVP flow.

## Session Protocol (15-20 minutes)

1. User describes current recipe-to-shopping workflow.
2. User performs full app flow:
   - capture/import
   - extract
   - edit
   - save
   - shopping checklist
3. Observer records:
   - completion time
   - correction count
   - confusion points
4. Ask debrief questions:
   - Would you use this weekly?
   - What was frustrating?
   - What was unexpectedly useful?

## Evidence Log

| Session ID | Date | Participant Profile | Time to List | Key Feedback | Product Change Triggered |
|------------|------|---------------------|--------------|--------------|--------------------------|
| DR-1 | February 24, 2026 | Internal dry run (cookbook photo) | 24s | Fraction OCR normalization issue | Added unicode fraction normalization in parser |
| DR-2 | February 24, 2026 | Internal dry run (social screenshot) | 31s | Non-ingredient text leaked into list | Strengthened blocked-token filtering |
| DR-3 | February 24, 2026 | Internal dry run (blurry photo) | fail/no text | Error guidance needed | Added clearer no-text retry messaging |
| U1 | February 25, 2026 | Roommate #1, undergrad student, cooks 4 nights/week, TikTok + YouTube recipes | 1m 56s | "This is faster than my Notes app list, but I still need to double-check fractions." | Added visible confidence + kept raw OCR lines in editor |
| U2 | February 26, 2026 | Roommate #2, undergrad student, cooks 3 nights/week, Instagram + Pinterest recipes | 2m 18s | "The import flow is great. Biggest pain is junk text from screenshots." | Tightened non-ingredient filtering and highlighted dropped lines |
| U3 | February 27, 2026 | Roommate #3, ELS student from Peru, cooks Peruvian meals 4 nights/week from screenshots/notes | 2m 04s | "Checklist persistence is the killer feature. Keep it offline and simple." | Prioritized list persistence and recipe re-generate action in library |

## Required Post-Session Updates

After each interview:

1. Add raw notes under `aiDocs/evidence/`
2. Update `aiDocs/roadmap.md` with resulting prioritized fixes

## Current Status

- Session protocol executed with 3 external users
- Detailed notes stored in:
  - `aiDocs/evidence/customer-conversation-u1.md`
  - `aiDocs/evidence/customer-conversation-u2.md`
  - `aiDocs/evidence/customer-conversation-u3.md`
  - `aiDocs/evidence/interview-notes.md` (compiled summary)
- Findings were incorporated into parser filtering, editor transparency, and shopping list persistence priorities
