# Falsification Test
## Recipe Scanning & Shopping List App — Pre-MVP Research

**Date:** February 2026

---

### What we were trying to break

The core assumption underneath the whole app: that users will trust an AI-extracted ingredient list enough to actually shop from it — and that if something is wrong, they'll notice before it becomes a problem at the store.

If that assumption doesn't hold — if people trust it blindly and miss errors, or refuse to trust it at all — the app either creates a new failure mode or doesn't change behavior enough to matter.

---

### How we ran it

Three participants, all people we had easy access to. Not a representative sample — they skew young and none cook from physical cookbooks regularly. Worth sitting with as a limitation.

Used a Keynote mockup, not a real build. They took a photo of a printed recipe card, and a few seconds later a pre-loaded "scan result" appeared on screen. Recipe was simple — eight ingredients, clean formatting, nothing exotic. The kind of scan the app should handle easily.

Two deliberate errors were planted in the extracted list:
- One ingredient removed entirely (mid-list, easy to visually skip)
- One quantity changed (same unit, just the number was wrong — the kind of error that affects the dish but doesn't look obviously off)

Prompt kept loose on purpose: "Pretend you're making this tomorrow — what do you do with this?" We didn't mention errors until after.

---

### What happened

| | Checked against the original? | What they caught |
|---|---|---|
| Participant A | No — accepted the list immediately | Nothing |
| Participant B | Yes — read through carefully | Wrong quantity only |
| Participant C | Sort of — skimmed it | Missing ingredient only |

No one caught both errors. The one who didn't check caught nothing. The two who did check each caught the error that matched their existing anxiety — one was focused on measurements, one was thinking about completeness. Neither compared the list against the source systematically.

When we told Participant A what they'd missed, the response was roughly: it's fine, I'd figure it out. Probably true — the dish wouldn't have been ruined. But that's not really the point.

---

### What this tells us

The hypothesis doesn't hold cleanly. Users aren't running systematic checks. They scan the output through the lens of what they're already worried about, which means they'll consistently miss the class of errors they're not looking for.

An open edit field isn't sufficient protection if people don't know where to look. It doesn't help someone who thinks the list looks fine.

Participant A's reaction is worth flagging separately. Low stakes, low concern. That profile — easy to onboard, won't churn over an error, but also won't notice when the app actually helps — is harder to build word-of-mouth on than assumed. They won't tell anyone the app saved them from a bad grocery trip because they didn't experience it as a save.

---

### What we'd change

The app needs to direct attention, not just allow editing. Low-confidence fields should be visually flagged before the user reaches the shopping list screen. The goal is that every user reviews the list — not that the list is accurate enough to skip review, because it won't always be.

---

*This was one test with three people. Treat it as directional, not conclusive.*
