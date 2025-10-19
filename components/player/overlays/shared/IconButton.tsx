import React, { ComponentType } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";

type IconComponent = LucideIcon | ComponentType<{ color?: string; size?: number }>;

interface IconButtonProps {
  icon: IconComponent;
  onPress?: () => void;
  disabled?: boolean;
  active?: boolean;
  size?: number;
  style?: any;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, onPress, disabled, active, size = 24, style }) => {
  const ResolvedIcon = icon as ComponentType<{ color?: string; size?: number }>;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        active && styles.iconButtonActive,
        disabled && styles.iconButtonDisabled,
        pressed && !disabled && styles.iconButtonPressed,
        style,
      ]}
    >
      <ResolvedIcon color={disabled ? "#666" : active ? "#00D8A4" : "#fff"} size={size} />
    </Pressable>
  );
};

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
