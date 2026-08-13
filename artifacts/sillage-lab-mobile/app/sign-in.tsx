import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@workspace/s1/hooks/use-colors';
import { nativeTheme } from '@workspace/s1/lib/native-theme';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/conversations');
      }
    } catch (err) {
      setError('Sign in failed. Please try again.');
      console.error('OAuth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: topPad + 60 }]}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logoMark}
          resizeMode="contain"
        />

        <Text
          style={[
            styles.brand,
            {
              color: colors.foreground,
              fontFamily: nativeTheme.fontFamily.sansBold,
            },
          ]}
        >
          Sillage Lab
        </Text>

        <Text
          style={[
            styles.tagline,
            {
              color: colors.mutedForeground,
              fontFamily: nativeTheme.fontFamily.sans,
            },
          ]}
        >
          Your coaching companion at the bench
        </Text>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 32 }]}>
        {error ? (
          <Text
            style={[
              styles.errorText,
              {
                color: colors.destructive,
                fontFamily: nativeTheme.fontFamily.sans,
              },
            ]}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSignIn}
          disabled={loading}
          style={({ pressed }) => [
            styles.signInBtn,
            {
              backgroundColor: colors.accent,
              borderRadius: nativeTheme.radius,
              opacity: pressed || loading ? 0.8 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.accentForeground} />
          ) : (
            <>
              <Feather
                name="chrome"
                size={18}
                color={colors.accentForeground}
              />
              <Text
                style={[
                  styles.signInBtnText,
                  {
                    color: colors.accentForeground,
                    fontFamily: nativeTheme.fontFamily.sansSemiBold,
                  },
                ]}
              >
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        <Text
          style={[
            styles.legal,
            {
              color: colors.mutedForeground,
              fontFamily: nativeTheme.fontFamily.sans,
            },
          ]}
        >
          Sign in to access your coaching sessions
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  logoMark: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: 34,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 14,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  signInBtnText: {
    fontSize: 15,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  legal: {
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 8,
    lineHeight: 18,
  },
});
