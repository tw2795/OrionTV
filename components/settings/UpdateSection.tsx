import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { ThemedText } from "../ThemedText";
import { version as currentVersion } from "../../package.json";

// 版本发布日期
const BUILD_DATE = "2025-10-12";

export function UpdateSection() {
  return (
    <View style={styles.sectionContainer}>
      <ThemedText style={styles.sectionTitle}>版本信息</ThemedText>

      <View style={styles.row}>
        <ThemedText style={styles.label}>当前版本</ThemedText>
        <ThemedText style={styles.value}>v{currentVersion}</ThemedText>
      </View>

      <View style={styles.row}>
        <ThemedText style={styles.label}>释出日期</ThemedText>
        <ThemedText style={styles.value}>{BUILD_DATE}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: Platform.select({
      ios: "rgba(255, 255, 255, 0.05)",
      android: "rgba(255, 255, 255, 0.05)",
      default: "transparent",
    }),
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: Platform.isTV ? 24 : 20,
    fontWeight: "bold",
    marginBottom: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: Platform.isTV ? 18 : 16,
    color: "#999",
  },
  value: {
    fontSize: Platform.isTV ? 18 : 16,
  },
});
