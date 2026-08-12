import React from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";
import { useColors } from "../../hooks/use-colors";
import { nativeTheme } from "../../lib/native-theme";

export type BadgeVariant = "default" | "accent" | "destructive" | "secondary";

export interface BadgeProps extends ViewProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  children,
  style,
  ...props
}: BadgeProps) {
  const colors = useColors();

  const getBg = () => {
    if (variant === "accent") return colors.accent;
    if (variant === "destructive") return colors.destructive;
    if (variant === "secondary") return colors.secondary;
    return colors.muted;
  };

  const getFg = () => {
    if (variant === "accent") return colors.accentForeground;
    if (variant === "destructive") return colors.destructiveForeground;
    if (variant === "secondary") return colors.secondaryForeground;
    return colors.foreground;
  };

  return (
    <View
      {...props}
      style={[
        styles.badge,
        {
          backgroundColor: getBg(),
          borderRadius: nativeTheme.radius,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: getFg(), fontFamily: nativeTheme.fontFamily.sansMedium },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
});
