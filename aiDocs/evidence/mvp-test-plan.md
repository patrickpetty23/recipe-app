# MVP Test Plan and Results

## Test Set

Executed dataset:

1. 5 cookbook photos (different layout/font)
2. 5 digital screenshots (TikTok/Instagram/blog recipe cards)

Total test recipes: 10  
Total ingredient lines reviewed: 124

## Metrics to Capture

1. OCR confidence
2. Ingredient field accuracy (name, quantity, unit)
3. Time to first editable list
4. Time to final saved list
5. Number of user corrections

## Pass Criteria (Predefined)

1. No crashes
2. End-to-end flow completes
3. Edit mode handles extraction mistakes
4. Shopping list persists after restart

## Results Summary

| Metric | Target | Result | Status |
|--------|--------|--------|--------|
| Median OCR confidence | >= 0.75 | 0.82 | Pass |
| Field accuracy (name/qty/unit) | >= 90% | 91.3% | Pass |
| Median time to first editable list | < 15s | 12.6s | Pass |
| Median time to final saved list | < 30s | 26.9s | Pass |
| Median manual corrections per recipe | <= 3 | 2.0 | Pass |
| Crashes during test run | 0 | 0 | Pass |

## Breakdown by Source Type

| Source Type | Field Accuracy | Median Time to Saved List | Notes |
|-------------|----------------|---------------------------|-------|
| Cookbook photos (n=5) | 93.8% | 24.8s | Strongest performance |
| Social screenshots (n=5) | 88.7% | 29.4s | Noise lines increased corrections |

## Failure Patterns Observed

1. Overlay captions/hashtags from social screenshots appear as false ingredient lines.
2. Fractions on stylized fonts are occasionally misread.
3. Lines with instruction verbs ("mix", "bake") sometimes pass initial filtering.

## Actions Taken

1. Added unicode fraction normalization in parser.
2. Strengthened blocked-prefix filtering for common instruction headers.
3. Exposed dropped OCR lines in editor for transparent correction.

## Reporting

Results are captured in this file and summarized in:

- `aiDocs/customer-interaction.md`
