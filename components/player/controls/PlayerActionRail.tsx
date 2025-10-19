import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent, ViewStyle, StyleProp } from "react-native";

interface PlayerActionRailProps {
  isPortrait?: boolean;
  alignCenter?: boolean;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  children: React.ReactNode;
}

const PlayerActionRail: React.FC<PlayerActionRailProps> = ({ isPortrait, alignCenter, style, onLayout, children }) => {
  const [containerHeight, setContainerHeight] = useState(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height !== containerHeight) {
      setContainerHeight(height);
    }
    onLayout?.(event);
  }, [containerHeight, onLayout]);

  const containerStyles = useMemo(() => {
    const stylesArray: (ViewStyle | StyleProp<ViewStyle>)[] = [styles.container];
    const shouldCenter = alignCenter || !isPortrait;

    if (shouldCenter) {
      stylesArray.push(styles.centeredBase);
      stylesArray.push(
        containerHeight > 0
          ? { top: "50%", marginTop: -(containerHeight / 2) }
          : { top: "50%" }
      );
    } else if (isPortrait) {
      stylesArray.push(styles.portrait);
    }

    if (style) {
      stylesArray.push(style);
    }

    return stylesArray;
  }, [alignCenter, containerHeight, isPortrait, style]);

  return (
    <View style={containerStyles} onLayout={handleLayout}>
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
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  centeredBase: {
    justifyContent: "center",
  },
  portrait: {
    top: 24,
  },
  buttonSlot: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
});

export default PlayerActionRail;
