import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Battery from "expo-battery";

export const DEFAULT_KNOB_SIZE = 16;

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const useSystemStatus = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    let isMounted = true;
    Battery.getBatteryLevelAsync()
      .then((level) => {
        if (isMounted) {
          setBatteryLevel(level);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBatteryLevel(null);
        }
      });

    const subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setBatteryLevel(batteryLevel);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return {
    batteryLevel,
    currentTime,
  };
};

export const formatClock = (date: Date) =>
  date.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

export const BatteryIndicator: React.FC<{ level: number | null }> = ({ level }) => {
  const percentage = level != null ? clamp(level, 0, 1) : 0;
  const fillColor = percentage >= 0.5 ? "#00D8A4" : percentage >= 0.2 ? "#FFB020" : "#FF5F5F";

  return (
    <View style={styles.batteryContainer}>
      <View style={styles.batteryBody}>
        <View style={[styles.batteryFill, { flex: percentage, backgroundColor: fillColor }]} />
        <View style={{ flex: 1 - percentage }} />
      </View>
      <View style={styles.batteryCap} />
    </View>
  );
};

const styles = StyleSheet.create({
  batteryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  batteryBody: {
    width: 24,
    height: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 3,
    flexDirection: "row",
    overflow: "hidden",
  },
  batteryFill: {
    height: "100%",
  },
  batteryCap: {
    width: 2,
    height: 6,
    marginLeft: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
});
