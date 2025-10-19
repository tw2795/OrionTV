import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";

interface PlayerActionRailProps {
  isPortrait?: boolean;
  alignCenter?: boolean;
  children: React.ReactNode;
}

const PlayerActionRail: React.FC<PlayerActionRailProps> = ({
  isPortrait,
  alignCenter,
  children,
}) => {
  const [containerHeight, setContainerHeight] = useState(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height !== containerHeight) {
      setContainerHeight(height);
    }
  }, [containerHeight]);

  const containerStyles = useMemo(() => {
    const stylesArray: any[] = [styles.container];

    if (alignCenter) {
      stylesArray.push(styles.centeredBase);
      stylesArray.push(
        containerHeight > 0
          ? { top: "50%", marginTop: -(containerHeight / 2) }
          : { top: "50%" },
      );
    } else if (isPortrait) {
      stylesArray.push(styles.portrait);
    } else {
      stylesArray.push(styles.landscape);
    }

    return stylesArray;
  }, [alignCenter, containerHeight, isPortrait]);

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
    borderRadius: 18,
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
    height: 44,
  },
});

export default PlayerActionRail;
