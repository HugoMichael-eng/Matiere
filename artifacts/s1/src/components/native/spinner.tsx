import React from "react";
import { ActivityIndicator, type ActivityIndicatorProps } from "react-native";
import { useColors } from "../../hooks/use-colors";

export interface SpinnerProps extends Omit<ActivityIndicatorProps, "color"> {
  color?: string;
}

export function Spinner({ color, size = "small", ...props }: SpinnerProps) {
  const colors = useColors();
  return (
    <ActivityIndicator color={color ?? colors.accent} size={size} {...props} />
  );
}
