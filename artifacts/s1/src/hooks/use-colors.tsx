import { useColorScheme } from "react-native";
import { nativeTheme, type NativeColors } from "../lib/native-theme";

export type ColorsWithTheme = NativeColors & {
  radius: number;
  spacing: number;
  fontFamily: typeof nativeTheme.fontFamily;
};

/**
 * Returns the S1 design system's semantic color tokens for the
 * current device color scheme, plus radius, spacing, and font names.
 */
export function useColors(): ColorsWithTheme {
  const scheme = useColorScheme();
  const palette: NativeColors =
    scheme === "dark" ? nativeTheme.dark : nativeTheme.light;
  return {
    ...palette,
    radius: nativeTheme.radius,
    spacing: nativeTheme.spacing,
    fontFamily: nativeTheme.fontFamily,
  };
}
