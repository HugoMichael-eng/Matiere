/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#0B0A08",
      "foreground": "#F3EDE2",
      "border": "#382819",
      "card": "#130F0C",
      "cardForeground": "#F3EDE2",
      "popover": "#1A1410",
      "popoverForeground": "#F3EDE2",
      "primary": "#F2BA36",
      "primaryForeground": "#140F0B",
      "secondary": "#2F1D0C",
      "secondaryForeground": "#F3EDE2",
      "muted": "#2D2114",
      "mutedForeground": "#A59783",
      "accent": "#F2BA36",
      "accentForeground": "#140F0B",
      "destructive": "#C43030",
      "destructiveForeground": "#F3EDE2",
      "input": "#382819",
      "ring": "#F2BA36",
      "chart1": "#F2BA36",
      "chart2": "#F3EDE2",
      "chart3": "#A59783",
      "chart4": "#C43030",
      "chart5": "#7A6550",
      "sidebar": "#080706",
      "sidebarForeground": "#F3EDE2",
      "sidebarBorder": "#261C11",
      "sidebarPrimary": "#F2BA36",
      "sidebarPrimaryForeground": "#140F0B",
      "sidebarAccent": "#1A1410",
      "sidebarAccentForeground": "#F3EDE2",
      "sidebarRing": "#F2BA36"
    },
    "dark": {
      "background": "#0B0A08",
      "foreground": "#F3EDE2",
      "border": "#382819",
      "card": "#130F0C",
      "cardForeground": "#F3EDE2",
      "popover": "#1A1410",
      "popoverForeground": "#F3EDE2",
      "primary": "#F2BA36",
      "primaryForeground": "#140F0B",
      "secondary": "#2F1D0C",
      "secondaryForeground": "#F3EDE2",
      "muted": "#2D2114",
      "mutedForeground": "#A59783",
      "accent": "#F2BA36",
      "accentForeground": "#140F0B",
      "destructive": "#D64040",
      "destructiveForeground": "#140F0B",
      "input": "#382819",
      "ring": "#F2BA36",
      "chart1": "#F2BA36",
      "chart2": "#F3EDE2",
      "chart3": "#A59783",
      "chart4": "#D64040",
      "chart5": "#7A6550",
      "sidebar": "#080706",
      "sidebarForeground": "#F3EDE2",
      "sidebarBorder": "#261C11",
      "sidebarPrimary": "#F2BA36",
      "sidebarPrimaryForeground": "#140F0B",
      "sidebarAccent": "#1A1410",
      "sidebarAccentForeground": "#F3EDE2",
      "sidebarRing": "#F2BA36"
    }
  },
  "fontFamily": {
    "sans": [
      "Jost",
      "sans-serif"
    ],
    "serif": [
      "Jost",
      "sans-serif"
    ],
    "mono": [
      "DM Mono",
      "monospace"
    ]
  },
  "radius": "0rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
