import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Play } from "lucide-react-native";
import usePlayerStore from "@/stores/playerStore";
import { formatTime } from "@/utils/formatTime";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

/**
 * CenterPlayOverlay component
 * Displays a large play icon (when paused) and time information in the center of the video.
 * Time display follows the visibility of player controls instead of the play icon.
 */
export const CenterPlayOverlay: React.FC = () => {
  const { status, togglePlayPause, showControls } = usePlayerStore();
  const { deviceType } = useResponsiveLayout();
  const isTV = deviceType === "tv";

  if (!status?.isLoaded || !showControls) {
    return null;
  }

  const currentTime = formatTime(status.positionMillis);
  const totalTime = formatTime(status.durationMillis || 0);
  const isPaused = !status.isPlaying;

  const overlayPointerEvents = isPaused ? (isTV ? "none" : "box-none") : "none";

  return (
    <View
      style={[styles.overlay, isPaused ? styles.overlayActive : styles.overlayInactive]}
      pointerEvents={overlayPointerEvents}
    >
      {isPaused &&
        (isTV ? (
          <View style={styles.centerContent}>
            <Play color="white" size={80} fill="white" />
          </View>
        ) : (
          <Pressable style={styles.centerContent} onPress={togglePlayPause} pointerEvents="auto">
            <Play color="white" size={80} fill="white" />
          </Pressable>
        ))}

      <View style={[styles.timeContainer, isPaused ? styles.timeWithOverlay : styles.timeFloating]}>
        <Text style={styles.timeText}>
          {currentTime} / {totalTime}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  overlayActive: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayInactive: {
    backgroundColor: "transparent",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  timeContainer: {
    marginTop: 20,
  },
  timeText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  timeWithOverlay: {},
  timeFloating: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
