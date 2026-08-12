import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useColors } from "../../hooks/use-colors";
import { nativeTheme } from "../../lib/native-theme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, style, ...props }, ref) => {
    const colors = useColors();

    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text
            style={[
              styles.label,
              {
                color: colors.foreground,
                fontFamily: nativeTheme.fontFamily.sansMedium,
              },
            ]}
          >
            {label}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          {...props}
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: error ? colors.destructive : colors.border,
              borderRadius: nativeTheme.radius,
              fontFamily: nativeTheme.fontFamily.sans,
            },
            style,
          ]}
        />
        {error ? (
          <Text
            style={[
              styles.error,
              {
                color: colors.destructive,
                fontFamily: nativeTheme.fontFamily.sans,
              },
            ]}
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  error: {
    fontSize: 12,
  },
});
