import { tokens } from "../generated/tokens";

const radiusRaw = tokens.radius;
const radius = radiusRaw.endsWith("rem")
  ? Number.parseFloat(radiusRaw) * 16
  : Number.parseFloat(radiusRaw);

const spacingRaw = tokens.spacing;
const spacing = spacingRaw.endsWith("rem")
  ? Number.parseFloat(spacingRaw) * 16
  : Number.parseFloat(spacingRaw);

/**
 * Portable design theme for React Native.
 * Colors sourced from tokens.json (light and dark sets).
 * Radius and spacing converted from rem to px.
 * Font family names match the registered @expo-google-fonts names.
 */
export const nativeTheme = {
  light: tokens.color.light,
  dark: tokens.color.dark,
  radius,
  spacing,
  fontFamily: {
    sans: "Inter_400Regular",
    sansMedium: "Inter_500Medium",
    sansSemiBold: "Inter_600SemiBold",
    sansBold: "Inter_700Bold",
  },
} as const;

export type NativeColors = typeof nativeTheme.light;
