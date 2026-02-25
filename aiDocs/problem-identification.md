# Problem Identification

## Primary Problem Statement

Home cooks waste time and make mistakes when manually converting recipe ingredients into a shopping list, especially when recipes come from photos/screenshots.

## Why This Problem

1. High-frequency workflow (meal planning repeats weekly).
2. Pain is immediate and practical (time + forgotten items).
3. Solvable with focused OCR + edit pipeline.

## Alternative Problems Considered

1. Recipe discovery/recommendation app
- Rejected: crowded space, weak capstone differentiation

2. Nutrition and macro tracker
- Rejected: requires food databases and high data accuracy burden

3. Meal calendar planner first
- Rejected: planning UI heavy, weaker immediate user value for MVP

## Due Diligence / Try-to-Prove-Wrong

Potential reasons this may fail:

1. Users tolerate manual notes and will not switch
2. OCR noise may be too high for trust
3. Editing may cancel out speed benefit

Current build addresses these risks by making the edit step explicit and fast rather than pretending extraction is always perfect.

## Falsifiability Criteria

The problem statement is false if either condition holds:

1. Users do not complete list creation faster than current method.
2. Users do not prefer app-assisted flow after trial week.

If falsified, pivot options are documented in `aiDocs/success-failure-plan.md`.

## Falsification Test Executed

A formal falsification attempt was run and documented in:

- `aiDocs/falsification-test.md`

Summary:

1. In planted-error testing, participants did not consistently catch all extraction errors without guidance.
2. In live pilot sessions, users still reported the app flow as faster than their manual method.
3. Result: the problem remains valid, but trust requires explicit review cues and stronger screenshot-noise filtering.
