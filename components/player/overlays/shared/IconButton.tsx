import React, { ComponentType, forwardRef } from "react";
import { Pressable, StyleSheet, PressableProps, View, PressableStateCallbackType, StyleProp, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";

type IconComponent = LucideIcon | ComponentType<{ color?: string; size?: number }>;

interface IconButtonProps extends PressableProps {
  icon: IconComponent;
  active?: boolean;
  size?: number;
}

export const IconButton = forwardRef<View, IconButtonProps>(
  ({ icon, disabled, active, size = 24, style, ...rest }, ref) => {
    const ResolvedIcon = icon as ComponentType<{ color?: string; size?: number }>;

    const resolvedStyle = (state: PressableStateCallbackType): StyleProp<ViewStyle> => [
      styles.iconButton,
      active && styles.iconButtonActive,
      disabled && styles.iconButtonDisabled,
      state.pressed && !disabled && styles.iconButtonPressed,
      typeof style === "function" ? style(state) : style,
    ];

    return (
      <Pressable
        ref={ref}
        disabled={disabled}
        style={resolvedStyle}
        {...rest}
      >
        <ResolvedIcon color={disabled ? "#666" : active ? "#00D8A4" : "#fff"} size={size} />
      </Pressable>
    );
  }
);

IconButton.displayName = "IconButton";

const styles = StyleSheet.create({
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderRadius: 999,
  },
  iconButtonPressed: {
    opacity: 0.9,
  },
  iconButtonDisabled: {
    opacity: 0.35,
  },
  iconButtonActive: {
    backgroundColor: "rgba(0,216,164,0.18)",
  },
});
