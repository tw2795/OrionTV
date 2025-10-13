import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Pause, Play } from "lucide-react-native";
import { ThemedText } from "@/components/ThemedText";
import { MediaButton } from "@/components/MediaButton";

import usePlayerStore from "@/stores/playerStore";
import useDetailStore from "@/stores/detailStore";
import { useSources } from "@/stores/sourceStore";
import { formatTime } from "@/utils/formatTime";

interface PlayerControlsProps {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({ showControls, setShowControls }) => {
  const {
    currentEpisodeIndex,
    episodes,
    status,
    isSeeking,
    seekPosition,
    progressPosition,
    playbackRate,
    togglePlayPause,
    playEpisode,
    playPreviousEpisode,
    setShowEpisodeModal,
    setShowSourceModal,
    setShowSpeedModal,
    setIntroEndTime,
    setOutroStartTime,
    introEndTime,
    outroStartTime,
  } = usePlayerStore();

  const { detail } = useDetailStore();
  const resources = useSources();

  const videoTitle = detail?.title || "";
  const currentEpisode = episodes[currentEpisodeIndex];
  const currentEpisodeTitle = currentEpisode?.title;
  const currentSource = resources.find((r) => r.source === detail?.source);
  const currentSourceName = currentSource?.source_name;
  const hasNextEpisode = currentEpisodeIndex < (episodes.length || 0) - 1;
  const hasPreviousEpisode = currentEpisodeIndex > 0;

  const onPlayNextEpisode = () => {
    if (hasNextEpisode) {
      playEpisode(currentEpisodeIndex + 1);
    }
  };

  return (
    <View style={styles.controlsOverlay}>
      <View style={styles.topControls}>
        <Text style={styles.controlTitle}>
          {videoTitle} {currentEpisodeTitle ? `- ${currentEpisodeTitle}` : ""}{" "}
          {currentSourceName ? `(${currentSourceName})` : ""}
        </Text>
      </View>

      <View style={styles.bottomControlsContainer}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View
            style={[
              styles.progressBarFilled,
              {
                width: `${(isSeeking ? seekPosition : progressPosition) * 100}%`,
              },
            ]}
          />
          <Pressable style={styles.progressBarTouchable} />
        </View>

        <ThemedText style={{ color: "white", marginTop: 5 }}>
          {status?.isLoaded
            ? `${formatTime(status.positionMillis)} / ${formatTime(status.durationMillis || 0)}`
            : "00:00 / 00:00"}
        </ThemedText>

        <View style={styles.bottomControls}>
          <MediaButton onPress={onPlayNextEpisode} disabled={!hasNextEpisode} hasTVPreferredFocus={showControls}>
            <Text style={[styles.buttonText, !hasNextEpisode && styles.buttonTextDisabled]}>下集</Text>
          </MediaButton>

          <MediaButton onPress={playPreviousEpisode} disabled={!hasPreviousEpisode}>
            <Text style={[styles.buttonText, !hasPreviousEpisode && styles.buttonTextDisabled]}>上集</Text>
          </MediaButton>

          <MediaButton onPress={() => setShowEpisodeModal(true)}>
            <Text style={styles.buttonText}>选集</Text>
          </MediaButton>

          <MediaButton onPress={() => setShowSpeedModal(true)} timeLabel={playbackRate !== 1.0 ? `${playbackRate}x` : undefined}>
            <Text style={styles.buttonText}>倍速</Text>
          </MediaButton>

          <MediaButton onPress={() => setShowSourceModal(true)}>
            <Text style={styles.buttonText}>换源</Text>
          </MediaButton>

          <MediaButton onPress={setIntroEndTime} timeLabel={introEndTime ? formatTime(introEndTime) : undefined}>
            <Text style={styles.buttonText}>片头</Text>
          </MediaButton>

          <MediaButton onPress={setOutroStartTime} timeLabel={outroStartTime ? formatTime(outroStartTime) : undefined}>
            <Text style={styles.buttonText}>片尾</Text>
          </MediaButton>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "space-between",
    padding: 20,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  bottomControlsContainer: {
    width: "100%",
    alignItems: "center",
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 15,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    position: "relative",
    marginTop: 10,
  },
  progressBarBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
  },
  progressBarFilled: {
    position: "absolute",
    left: 0,
    height: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  progressBarTouchable: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 30,
    top: -10,
    zIndex: 10,
  },
  controlButton: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  topRightContainer: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44, // Match TouchableOpacity default size for alignment
  },
  resolutionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonTextDisabled: {
    color: "#666",
  },
});
