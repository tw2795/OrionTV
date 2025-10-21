import React from "react";
import { View, StyleSheet, LayoutChangeEvent, ViewStyle, StyleProp } from "react-native";

interface PlayerActionRailProps {
  isPortrait?: boolean;
  alignCenter?: boolean;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  children: React.ReactNode;
}

const PlayerActionRail: React.FC<PlayerActionRailProps> = ({ isPortrait: _isPortrait, alignCenter, style, onLayout, children }) => {
  return (
    <View style={[styles.container, alignCenter && styles.centeredBase, style]} onLayout={onLayout}>
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
    right: 20,
    // 背景设为透明，避免遮挡视频内容
    backgroundColor: "transparent",
    borderRadius: 24,
    // 适配按钮个数：收紧内边距
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  centeredBase: {
    justifyContent: "center",
  },
  buttonSlot: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
});

export default PlayerActionRail;
