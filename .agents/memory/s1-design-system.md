---
name: S1 Design System
description: S1 token palette, font choices, and how it's wired into Sillage Lab.
---

# S1 Design System

## Identity
- Artifact: `artifacts/s1`, previewPath `/s1/`
- Design language: industrial cool-lab — CDG × Acne Studio × Arpa Studios

## Fonts
- **Serif (display)**: Bodoni Moda — extreme stroke contrast, editorial, ultra-luxury
- **Sans (UI copy)**: Jost — geometric grotesque, Futura PT free stand-in; Futura PT is commercial/not on Google Fonts
- **Mono (lab data)**: DM Mono

**Why:** User requested Futura PT + an editorial serif. Futura PT has no Google Fonts version; Jost was chosen as the closest loadable match. If user provides `.woff2` files, they can be embedded in `scripts/theme-template.css`.

## Core Palette (light / dark)
- Background: `#F2F1EF` / `#0C0D0F` — concrete beige-grey / deep cool black
- Foreground: `#131416` / `#E5E7ED`
- Secondary: `#C8D0DE` / `#1E2438` — definitive blue-grey
- Muted: `#BBC4D2` / `#252B40`
- Accent: `#EFC84A` / `#EFC84A` — German Yellow, unchanged in both modes
- Sidebar: `#0C0D0F` / `#080910` — deep black in both modes

## Radius
Zero (`0rem`) — sharp industrial edges, no softening.

## How to apply
- Consuming app imports `@import "@workspace/s1/styles.css"` as the only theme line.
- App-specific utilities (`.font-display`, `.font-mono-ui`, animations) go in the app CSS after the import.
- Sillage Lab migrated this way — `artifacts/sillage-lab/src/index.css` is now a single import line + small utilities block.

## What NOT to do
- Do not hand-edit `artifacts/s1/src/index.css` or `src/generated/tokens.tsx` — they are generated from `tokens.json`.
- Run `pnpm tokens` (inside `artifacts/s1/`) or let the dev server regenerate after any `tokens.json` change.
