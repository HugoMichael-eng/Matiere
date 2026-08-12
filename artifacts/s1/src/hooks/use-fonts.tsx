import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";

/**
 * Loads the S1 design system's font set (Inter) and returns load state.
 * Gate SplashScreen.hideAsync() on fontsLoaded || fontError.
 */
export function useDesignSystemFonts() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  return { fontsLoaded, fontError };
}
