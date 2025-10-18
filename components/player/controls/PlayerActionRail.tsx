import React from "react";
import { View, StyleSheet } from "react-native";

interface PlayerActionRailProps {
  isPortrait?: boolean;
  alignCenter?: boolean;
  children: React.ReactNode;
}

const PlayerActionRail: React.FC<PlayerActionRailProps> = ({ isPortrait, alignCenter, children }) => {
  const containerStyles = [
    styles.container,
    alignCenter ? styles.centered : isPortrait ? styles.portrait : styles.landscape,
  ];

  return (
    <View style={containerStyles}>
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
  portrait: {
    top: 24,
  },
  landscape: {
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  centered: {
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  buttonSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PlayerActionRail;
