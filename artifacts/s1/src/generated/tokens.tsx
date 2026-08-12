/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#F2F1EF",
      "foreground": "#131416",
      "border": "#B8C1D0",
      "card": "#FFFFFF",
      "cardForeground": "#131416",
      "popover": "#FFFFFF",
      "popoverForeground": "#131416",
      "primary": "#131416",
      "primaryForeground": "#F2F1EF",
      "secondary": "#C8D0DE",
      "secondaryForeground": "#131416",
      "muted": "#BBC4D2",
      "mutedForeground": "#565E72",
      "accent": "#EFC84A",
      "accentForeground": "#131416",
      "destructive": "#C43030",
      "destructiveForeground": "#FFFFFF",
      "input": "#B8C1D0",
      "ring": "#131416",
      "chart1": "#EFC84A",
      "chart2": "#131416",
      "chart3": "#565E72",
      "chart4": "#C43030",
      "chart5": "#4A6080",
      "sidebar": "#0C0D0F",
      "sidebarForeground": "#E5E7ED",
      "sidebarBorder": "#22252B",
      "sidebarPrimary": "#EFC84A",
      "sidebarPrimaryForeground": "#0C0D0F",
      "sidebarAccent": "#191C22",
      "sidebarAccentForeground": "#E5E7ED",
      "sidebarRing": "#EFC84A"
    },
    "dark": {
      "background": "#0C0D0F",
      "foreground": "#E5E7ED",
      "border": "#22252B",
      "card": "#141619",
      "cardForeground": "#E5E7ED",
      "popover": "#141619",
      "popoverForeground": "#E5E7ED",
      "primary": "#E5E7ED",
      "primaryForeground": "#0C0D0F",
      "secondary": "#1E2438",
      "secondaryForeground": "#E5E7ED",
      "muted": "#252B40",
      "mutedForeground": "#8892A8",
      "accent": "#EFC84A",
      "accentForeground": "#0C0D0F",
      "destructive": "#D64040",
      "destructiveForeground": "#0C0D0F",
      "input": "#22252B",
      "ring": "#E5E7ED",
      "chart1": "#EFC84A",
      "chart2": "#E5E7ED",
      "chart3": "#8C909C",
      "chart4": "#D64040",
      "chart5": "#5A7899",
      "sidebar": "#080910",
      "sidebarForeground": "#E5E7ED",
      "sidebarBorder": "#191C22",
      "sidebarPrimary": "#EFC84A",
      "sidebarPrimaryForeground": "#080910",
      "sidebarAccent": "#141619",
      "sidebarAccentForeground": "#E5E7ED",
      "sidebarRing": "#EFC84A"
    }
  },
  "fontFamily": {
    "sans": [
      "Jost",
      "sans-serif"
    ],
    "serif": [
      "Bodoni Moda",
      "serif"
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
