/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#FFFFFF",
      "foreground": "#0C0C0C",
      "border": "#DEDEDE",
      "card": "#F6F6F6",
      "cardForeground": "#0C0C0C",
      "popover": "#FFFFFF",
      "popoverForeground": "#0C0C0C",
      "primary": "#0C0C0C",
      "primaryForeground": "#FFFFFF",
      "secondary": "#EFEFEF",
      "secondaryForeground": "#0C0C0C",
      "muted": "#E8E8E8",
      "mutedForeground": "#6E6E6E",
      "accent": "#B0AAB8",
      "accentForeground": "#0C0C0C",
      "destructive": "#D63030",
      "destructiveForeground": "#FFFFFF",
      "input": "#DEDEDE",
      "ring": "#0C0C0C",
      "chart1": "#0C0C0C",
      "chart2": "#B0AAB8",
      "chart3": "#6E6E6E",
      "chart4": "#D63030",
      "chart5": "#ABABAB",
      "sidebar": "#0C0C0C",
      "sidebarForeground": "#F5F5F5",
      "sidebarBorder": "#252525",
      "sidebarPrimary": "#B0AAB8",
      "sidebarPrimaryForeground": "#0C0C0C",
      "sidebarAccent": "#1C1C1C",
      "sidebarAccentForeground": "#F5F5F5",
      "sidebarRing": "#B0AAB8"
    },
    "dark": {
      "background": "#0C0C0C",
      "foreground": "#F2F2F2",
      "border": "#2C2C2C",
      "card": "#161616",
      "cardForeground": "#F2F2F2",
      "popover": "#161616",
      "popoverForeground": "#F2F2F2",
      "primary": "#F2F2F2",
      "primaryForeground": "#0C0C0C",
      "secondary": "#202020",
      "secondaryForeground": "#F2F2F2",
      "muted": "#282828",
      "mutedForeground": "#8A8A8A",
      "accent": "#7A7482",
      "accentForeground": "#F2F2F2",
      "destructive": "#E04545",
      "destructiveForeground": "#0C0C0C",
      "input": "#2C2C2C",
      "ring": "#F2F2F2",
      "chart1": "#F2F2F2",
      "chart2": "#7A7482",
      "chart3": "#8A8A8A",
      "chart4": "#E04545",
      "chart5": "#505050",
      "sidebar": "#080808",
      "sidebarForeground": "#F2F2F2",
      "sidebarBorder": "#1E1E1E",
      "sidebarPrimary": "#7A7482",
      "sidebarPrimaryForeground": "#F2F2F2",
      "sidebarAccent": "#1A1A1A",
      "sidebarAccentForeground": "#F2F2F2",
      "sidebarRing": "#7A7482"
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
      "JetBrains Mono",
      "monospace"
    ]
  },
  "radius": "0rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
