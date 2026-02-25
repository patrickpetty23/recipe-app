# Success and Failure Planning

## Success Definition

The MVP is successful when:

1. Users consistently generate usable lists from recipe images.
2. Time-to-list is materially faster than manual entry.
3. Users report intention to reuse weekly.

## Success Indicators (Measured)

1. Median scan/import to list time < 30 seconds
2. User-reported "faster than old method" >= 70%
3. At least 50% of pilot users return within 7 days

## Failure Definition

The MVP is failing when:

1. OCR + edit workload is still slower than manual method.
2. Users do not trust extracted ingredients.
3. Users do not return after first try.

## Failure Indicators

1. Median time >= manual baseline
2. High correction count per recipe with no downward trend
3. 7-day return < 25%

## Pivot Plan If Successful

1. Add fuzzy multi-recipe dedupe for recurring weekly planning
2. Implement cloud fallback as opt-in for low-confidence screenshots
3. Add export/integration options after retention validates core flow

## Pivot Plan If Failing

1. Narrow to screenshot-only format where OCR performs best
2. Shift to semi-manual "smart checklist builder" rather than full OCR dependency
3. If no speed/trust advantage can be demonstrated, stop and re-scope project
