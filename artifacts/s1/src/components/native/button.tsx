import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";
import { useColors } from "../../hooks/use-colors";
import { nativeTheme } from "../../lib/native-theme";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "accent";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const colors = useColors();

  const getBg = () => {
    if (variant === "accent") return colors.accent;
    if (variant === "secondary") return colors.secondary;
    if (variant === "ghost") return "transparent";
    if (variant === "destructive") return colors.destructive;
    return colors.primary;
  };

  const getFg = () => {
    if (variant === "accent") return colors.accentForeground;
    if (variant === "secondary") return colors.secondaryForeground;
    if (variant === "ghost") return colors.foreground;
    if (variant === "destructive") return colors.destructiveForeground;
    return colors.primaryForeground;
  };

  const getPadding = () => {
    if (size === "sm") return { paddingVertical: 6, paddingHorizontal: 12 };
    if (size === "lg") return { paddingVertical: 16, paddingHorizontal: 24 };
    if (size === "icon") return { padding: 10 };
    return { paddingVertical: 12, paddingHorizontal: 16 };
  };

  const getFontSize = () => {
    if (size === "sm") return 13;
    if (size === "lg") return 16;
    return 14;
  };

  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBg(),
          borderRadius: nativeTheme.radius,
          opacity: pressed || disabled ? 0.7 : 1,
          ...getPadding(),
        },
        style as object,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getFg()} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getFg(),
              fontSize: getFontSize(),
              fontFamily: nativeTheme.fontFamily.sansMedium,
            },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontWeight: "500" as const,
  },
});
