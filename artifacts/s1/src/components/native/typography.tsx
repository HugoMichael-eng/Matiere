import React from "react";
import { Text, type TextProps } from "react-native";
import { useColors } from "../../hooks/use-colors";
import { nativeTheme } from "../../lib/native-theme";

export type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "small"
  | "muted"
  | "caption";

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  children: React.ReactNode;
}

const variantMap: Record<
  TypographyVariant,
  { fontSize: number; fontFamily: string; lineHeight: number }
> = {
  h1: { fontSize: 28, fontFamily: nativeTheme.fontFamily.sansBold, lineHeight: 34 },
  h2: { fontSize: 22, fontFamily: nativeTheme.fontFamily.sansSemiBold, lineHeight: 28 },
  h3: { fontSize: 17, fontFamily: nativeTheme.fontFamily.sansSemiBold, lineHeight: 22 },
  body: { fontSize: 15, fontFamily: nativeTheme.fontFamily.sans, lineHeight: 22 },
  small: { fontSize: 13, fontFamily: nativeTheme.fontFamily.sans, lineHeight: 18 },
  muted: { fontSize: 13, fontFamily: nativeTheme.fontFamily.sans, lineHeight: 18 },
  caption: { fontSize: 11, fontFamily: nativeTheme.fontFamily.sans, lineHeight: 15 },
};

export function Typography({
  variant = "body",
  style,
  children,
  ...props
}: TypographyProps) {
  const colors = useColors();
  const isMuted = variant === "muted";
  return (
    <Text
      {...props}
      style={[
        variantMap[variant],
        { color: isMuted ? colors.mutedForeground : colors.foreground },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
