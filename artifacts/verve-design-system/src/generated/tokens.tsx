/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#DFDDD9",
      "foreground": "#1A1A1A",
      "border": "#B9B7B3",
      "card": "#E7E5E1",
      "cardForeground": "#1A1A1A",
      "popover": "#ECEAE6",
      "popoverForeground": "#1A1A1A",
      "primary": "#1A1A1A",
      "primaryForeground": "#DFDDD9",
      "secondary": "#C9C7C3",
      "secondaryForeground": "#1A1A1A",
      "muted": "#D5D3CF",
      "mutedForeground": "#696763",
      "accent": "#A8A6A2",
      "accentForeground": "#1A1A1A",
      "destructive": "#6B2525",
      "destructiveForeground": "#F4F2EE",
      "input": "#A8A6A2",
      "ring": "#1A1A1A",
      "chart1": "#1A1A1A",
      "chart2": "#4B4A47",
      "chart3": "#777570",
      "chart4": "#A8A6A2",
      "chart5": "#C9C7C3",
      "sidebar": "#D5D3CF",
      "sidebarForeground": "#1A1A1A",
      "sidebarBorder": "#B9B7B3",
      "sidebarPrimary": "#1A1A1A",
      "sidebarPrimaryForeground": "#DFDDD9",
      "sidebarAccent": "#C9C7C3",
      "sidebarAccentForeground": "#1A1A1A",
      "sidebarRing": "#1A1A1A"
    },
    "dark": {
      "background": "#1A1A1A",
      "foreground": "#DFDDD9",
      "border": "#484744",
      "card": "#222220",
      "cardForeground": "#DFDDD9",
      "popover": "#292927",
      "popoverForeground": "#DFDDD9",
      "primary": "#DFDDD9",
      "primaryForeground": "#1A1A1A",
      "secondary": "#353432",
      "secondaryForeground": "#DFDDD9",
      "muted": "#2D2C2A",
      "mutedForeground": "#AAA8A3",
      "accent": "#565552",
      "accentForeground": "#F0EEEA",
      "destructive": "#9B4A4A",
      "destructiveForeground": "#FFF8F5",
      "input": "#565552",
      "ring": "#DFDDD9",
      "chart1": "#DFDDD9",
      "chart2": "#B9B7B3",
      "chart3": "#92908B",
      "chart4": "#6D6B67",
      "chart5": "#484744",
      "sidebar": "#141414",
      "sidebarForeground": "#DFDDD9",
      "sidebarBorder": "#484744",
      "sidebarPrimary": "#DFDDD9",
      "sidebarPrimaryForeground": "#1A1A1A",
      "sidebarAccent": "#353432",
      "sidebarAccentForeground": "#F0EEEA",
      "sidebarRing": "#DFDDD9"
    }
  },
  "fontFamily": {
    "sans": [
      "Inter",
      "sans-serif"
    ],
    "serif": [
      "Bricolage Grotesque",
      "sans-serif"
    ],
    "mono": [
      "IBM Plex Mono",
      "monospace"
    ]
  },
  "radius": "0rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
