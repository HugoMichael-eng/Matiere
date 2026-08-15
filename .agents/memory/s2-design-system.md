---
name: S2 Design System
description: S2 token decisions, font choices, and aesthetic rules for the Editorial Void design system.
---

# S2 Design System

**Slug:** `s2` | **Package:** `@workspace/s2` | **Preview:** `/s2/`

## Concept: Editorial Void
Pure black and white tension with a single cold muted lavender-steel accent. No warmth anywhere. Every edge sharp (zero radius). Two typefaces in deliberate contrast.

## Fonts
- **Sans (UI/body):** Jost — geometric grotesque, free Futura substitute. Loaded from Google Fonts.
- **Serif (display):** Cormorant Garamond — high-contrast editorial serif. Used for large display headlines only, never body.
- **Mono:** JetBrains Mono — clean technical mono.

**Why:** Futura is licensed/not on Google Fonts; Jost is the closest free substitute. Cormorant creates tension against Jost's rational geometry — the same pairing used in luxury fashion/beauty.

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
