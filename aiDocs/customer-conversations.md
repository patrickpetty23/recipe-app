# Customer Conversations
## Recipe Scanning & Shopping List App - Discovery Synthesis

**Date:** February 25, 2026

---

> **Method note:** Three interviews were conducted with roommates (ages 22-24) as a convenience sample. This is biased and non-random, but it gave fast directional evidence for the MVP.

---

### Interview #1 - Undergrad Student, 23
**Profile:** Cooks about 3-4x/week, recipe source is mostly TikTok/YouTube screenshots.

**Current workflow**
- Saves recipe videos/screenshots.
- Builds lists in Notes or relies on memory.
- Most common failure is forgetting one ingredient at the store.

**Signals**
- Screenshot import is a stronger entry point than camera scan.
- Multi-recipe planning did not resonate for this user.
- Fast correction flow mattered more than perfect OCR.

**Risk surfaced**
- Social caption/overlay noise is a real parsing failure mode.

---

### Interview #2 - Undergrad Student, 22
**Profile:** Social-recipe heavy workflow (Instagram/Pinterest), cooks about 3x/week.

**Current workflow**
- Screenshot to Reminders checklist.
- Manual cleanup is the highest-friction step.

**Signals**
- Import flow was viewed as high value.
- User accepted partial OCR errors if overall speed remained better than manual entry.
- Biggest pain remained junk text in social screenshots.

**Risk surfaced**
- Parser filtering quality is a central leverage point for this segment.

---

### Interview #3 - ELS Student from Peru, 22
**Profile:** Cooks about 4x/week, mixed Spanish/English ingredient wording from screenshots and notes.

**Current workflow**
- WhatsApp/shared screenshots plus handwritten notes.
- Manual rewrite step is slow, especially with mixed-language terms.

**Signals**
- Checklist persistence and predictable regenerate behavior were viewed as the highest value.
- Fast editable fields reduced language-friction risk.
- Offline-first behavior was explicitly preferred.

**Risk surfaced**
- Mixed-language ingredient naming is a real scenario that can degrade trust if editing is slow.

---

### Cross-Interview Synthesis

| Lens | U1 | U2 | U3 |
|---|---|---|---|
| Primary source format | TikTok/YouTube screenshots | Instagram/Pinterest screenshots | WhatsApp/screenshots/notes |
| Main pain before app | Forgetting items in-store | Social text clutter and copy effort | Rewriting/cleaning mixed-language lists |
| What resonated most | Speed + review before save | Import-first flow | Persistent checklist + easy edits |
| Biggest product risk | Trust in noisy extractions | Caption/overlay noise | Mixed-language ingredient wording |

**Product implication:** Screenshot-first reliability is the highest-leverage requirement. Camera cookbook scan remains useful, but early adoption depends on noisy screenshot handling and transparent correction.

---

### Traceability

- Detailed per-session notes:
  - `aiDocs/evidence/customer-conversation-u1.md`
  - `aiDocs/evidence/customer-conversation-u2.md`
  - `aiDocs/evidence/customer-conversation-u3.md`
- Compiled notes:
  - `aiDocs/evidence/interview-notes.md`
