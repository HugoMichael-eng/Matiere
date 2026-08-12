import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useColors } from "../../hooks/use-colors";
import { nativeTheme } from "../../lib/native-theme";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  bordered?: boolean;
}

export function Card({ children, bordered = true, style, ...props }: CardProps) {
  const colors = useColors();
  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: nativeTheme.radius,
          borderColor: colors.border,
          borderWidth: bordered ? 1 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
});
