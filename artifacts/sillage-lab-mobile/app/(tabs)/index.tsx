import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

/**
 * Root index: redirect to the appropriate screen based on auth state.
 * Shows a minimal loader while Clerk initialises.
 */
export default function IndexScreen() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={isSignedIn ? '/conversations' : '/sign-in'} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C0D0F',
  },
});
