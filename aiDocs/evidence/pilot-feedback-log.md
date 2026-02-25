# Pilot Feedback Log (Internal + External)

This file captures internal dry runs and external customer pilot sessions for midterm evidence.

| Session | Scenario | Time to List | Corrections | Main Issue Found | Action Taken |
|---------|----------|--------------|-------------|------------------|--------------|
| DR-1 | Cookbook photo in good light | 24s | 1 | Fraction format inconsistency | Added unicode fraction normalization |
| DR-2 | Screenshot with overlay text | 31s | 4 | Non-ingredient text leakage | Tightened blocked token filtering |
| DR-3 | Blurry angled page | Fail (no text) | N/A | OCR no-text path unclear | Added explicit retry guidance message |
| U1 | Roommate undergrad using TikTok/YouTube recipes | 1m 56s | 2 | Trust concerns on fractions | Kept confidence + dropped-line visibility |
| U2 | Roommate undergrad using Instagram/Pinterest screenshots | 2m 18s | 4 | Overlay/caption noise in OCR | Increased non-ingredient filtering strictness |
| U3 | Roommate ELS student from Peru using mixed Spanish/English notes | 2m 04s | 1 | Wanted predictable list persistence and easy term edits | Prioritized save/regenerate list behavior clarity |

## Consolidated Learnings

1. Speed target is mostly met; social screenshots remain the weak segment.
2. Trust improves when users can see confidence and dropped lines.
3. Persistent checklist behavior is more valuable than advanced AI features.

## Follow-up Actions Before Final

1. Add additional parser tests focused on social screenshot noise.
2. Capture one full real shopping-trip follow-up for final presentation.
3. Add UI copy clarifying list regeneration behavior.
