import React, { ComponentProps, forwardRef } from "react";
import { StyledButton } from "./StyledButton";
import { StyleSheet, View, Text } from "react-native";

type MediaButtonProps = ComponentProps<typeof StyledButton> & {
  timeLabel?: string;
  forceHighlighted?: boolean;
};

export const MediaButton = forwardRef<View, MediaButtonProps>(
  ({ timeLabel, forceHighlighted = false, style, isSelected, ...rest }, ref) => {
    const finalSelected = forceHighlighted || isSelected;

    return (
      <View>
        <StyledButton
          {...rest}
          ref={ref}
          style={[styles.mediaControlButton, style]}
          variant="ghost"
          isSelected={finalSelected}
        />
        {timeLabel && <Text style={styles.timeLabel}>{timeLabel}</Text>}
      </View>
    );
  }
);

MediaButton.displayName = "MediaButton";

const styles = StyleSheet.create({
  mediaControlButton: {
    padding: 12,
    minWidth: 80,
  },
  timeLabel: {
    position: "absolute",
    top: 14,
    right: 12,
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 4,
    borderRadius: 3,
  },
});
