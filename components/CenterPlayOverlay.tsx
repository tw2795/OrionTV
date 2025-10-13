import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Play } from "lucide-react-native";
import usePlayerStore from "@/stores/playerStore";
import { formatTime } from "@/utils/formatTime";

/**
 * CenterPlayOverlay component
 * Displays a large play icon and time information in the center of the video
 * Only shown when video is paused
 */
export const CenterPlayOverlay: React.FC = () => {
  const { status, togglePlayPause } = usePlayerStore();

  // Only render when video is loaded and paused
  if (!status?.isLoaded || status.isPlaying) {
    return null;
  }

  const currentTime = formatTime(status.positionMillis);
  const totalTime = formatTime(status.durationMillis || 0);

  return (
    <Pressable style={styles.overlay} onPress={togglePlayPause}>
      <View style={styles.container}>
        <Play color="white" size={80} fill="white" />
        <Text style={styles.timeText}>
          {currentTime} / {totalTime}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});
