---
name: S2 Design System
description: S2 token decisions, font choices, and aesthetic rules for the Editorial Void design system.
---

# S2 Design System

**Slug:** `s2` | **Package:** `@workspace/s2` | **Preview:** `/s2/`

## Concept: Editorial Void
Pure black and white tension with a single cold muted lavender-steel accent. No warmth anywhere. Every edge sharp (zero radius). Two typefaces in deliberate contrast.

## Fonts
- **Single typeface:** Jost only, weights 100–900. No serif. All contrast comes from weight and scale, not font family.
- **Mono:** JetBrains Mono — for formulas, CAS numbers, lab data, code only.

**Why:** CDG/Acne Studios reference — both are single-typeface systems. Cormorant Garamond was removed because the user didn't like it. The "serif" token alias in tokens.json also maps to Jost to keep CSS vars consistent.

## Key token values (light)
- accent: `#B0AAB8` — cold muted lavender-steel (the system's ONLY colour personality)
- primary: `#0C0C0C`, primaryForeground: `#FFFFFF`
- sidebar: `#0C0C0C` (black sidebar)
- radius.base: `0rem` — zero radius everywhere

## Key token values (dark)
- accent: `#7A7482` — same hue, less luminance
- primary: `#F2F2F2`, primaryForeground: `#0C0C0C`

## Rules
- Never soften edges — zero radius is non-negotiable
- Cormorant Garamond only for display/editorial, never body copy
- The lavender-steel accent is the only colour; don't add more
- Black sidebar in light mode is intentional drama
