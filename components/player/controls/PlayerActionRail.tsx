import React, { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";

interface PlayerActionRailProps {
  isPortrait?: boolean;
  children: React.ReactNode;
}

const PlayerActionRail: React.FC<PlayerActionRailProps> = ({ isPortrait, children }) => {
  const { height } = useWindowDimensions();
  const [railHeight, setRailHeight] = useState(0);

  const topOffset = isPortrait ? 24 : Math.max(24, (height - railHeight) / 2);

  return (
    <View
      style={[styles.container, { top: topOffset }, isPortrait ? styles.containerPortrait : styles.containerLandscape]}
      onLayout={({ nativeEvent }) => {
        const nextHeight = nativeEvent.layout.height;
        if (nextHeight !== railHeight) {
          setRailHeight(nextHeight);
        }
      }}
    >
      {React.Children.map(children, (child, index) => (
        <View key={index} style={styles.buttonSlot}>
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 14,
    gap: 16,
    alignItems: "center",
  },
  containerLandscape: {},
  containerPortrait: {},
  buttonSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PlayerActionRail;
