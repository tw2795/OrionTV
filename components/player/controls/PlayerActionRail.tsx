import React from "react";
import { View, StyleSheet } from "react-native";

interface PlayerActionRailProps {
  isPortrait?: boolean;
  children: React.ReactNode;
}

const PlayerActionRail: React.FC<PlayerActionRailProps> = ({ isPortrait, children }) => {
  return (
    <View style={[styles.container, isPortrait && styles.containerPortrait]}>
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
    top: 0,
    bottom: 0,
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  containerPortrait: {
    justifyContent: "flex-start",
    paddingTop: 32,
  },
  buttonSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PlayerActionRail;
