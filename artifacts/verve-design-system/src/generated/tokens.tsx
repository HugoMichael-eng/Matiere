/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#F1EFE9",
      "foreground": "#24231F",
      "border": "#C7C3B9",
      "card": "#F7F5F0",
      "cardForeground": "#24231F",
      "popover": "#FCFAF5",
      "popoverForeground": "#24231F",
      "primary": "#24231F",
      "primaryForeground": "#F1EFE9",
      "secondary": "#E3E0D8",
      "secondaryForeground": "#24231F",
      "muted": "#E9E6DE",
      "mutedForeground": "#6D6A62",
      "accent": "#D9FF43",
      "accentForeground": "#171812",
      "destructive": "#6B2525",
      "destructiveForeground": "#F4F2EE",
      "input": "#B9B5AB",
      "ring": "#D9FF43",
      "chart1": "#D9FF43",
      "chart2": "#667465",
      "chart3": "#8A7F72",
      "chart4": "#AEB4AE",
      "chart5": "#4E514A",
      "sidebar": "#E8E5DD",
      "sidebarForeground": "#24231F",
      "sidebarBorder": "#C7C3B9",
      "sidebarPrimary": "#24231F",
      "sidebarPrimaryForeground": "#F1EFE9",
      "sidebarAccent": "#D9FF43",
      "sidebarAccentForeground": "#171812",
      "sidebarRing": "#D9FF43"
    },
    "dark": {
      "background": "#12120F",
      "foreground": "#F1EFE9",
      "border": "#41413A",
      "card": "#1A1A17",
      "cardForeground": "#F1EFE9",
      "popover": "#20201C",
      "popoverForeground": "#F1EFE9",
      "primary": "#F1EFE9",
      "primaryForeground": "#171812",
      "secondary": "#30302A",
      "secondaryForeground": "#F1EFE9",
      "muted": "#272722",
      "mutedForeground": "#AAA79F",
      "accent": "#D9FF43",
      "accentForeground": "#171812",
      "destructive": "#9B4A4A",
      "destructiveForeground": "#FFF8F5",
      "input": "#505048",
      "ring": "#D9FF43",
      "chart1": "#D9FF43",
      "chart2": "#AEB4AE",
      "chart3": "#8A9A83",
      "chart4": "#B8AA9A",
      "chart5": "#73766F",
      "sidebar": "#0D0D0B",
      "sidebarForeground": "#F1EFE9",
      "sidebarBorder": "#41413A",
      "sidebarPrimary": "#F1EFE9",
      "sidebarPrimaryForeground": "#171812",
      "sidebarAccent": "#D9FF43",
      "sidebarAccentForeground": "#171812",
      "sidebarRing": "#D9FF43"
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
