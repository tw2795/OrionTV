import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MediaButton } from "@/components/MediaButton";

import usePlayerStore from "@/stores/playerStore";
import { formatTime } from "@/utils/formatTime";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface PlayerControlsProps {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  progressSlot?: React.ReactNode;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  showControls,
  setShowControls: _setShowControls,
  progressSlot,
}) => {
  const {
    currentEpisodeIndex,
    episodes,
    playbackRate,
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

  const { deviceType } = useResponsiveLayout();
  const [focusResetKey, setFocusResetKey] = useState(0);
  const isTouchLayout = deviceType !== "tv";
  const highlightButtons = isTouchLayout && showControls;

  useEffect(() => {
    if (deviceType === "tv" && showControls) {
      setFocusResetKey((key) => key + 1);
    }
  }, [deviceType, showControls]);

  const currentEpisode = episodes[currentEpisodeIndex];
  const hasNextEpisode = currentEpisodeIndex < (episodes.length || 0) - 1;
  const hasPreviousEpisode = currentEpisodeIndex > 0;

  const onPlayNextEpisode = () => {
    if (hasNextEpisode) {
      playEpisode(currentEpisodeIndex + 1);
    }
  };

  return (
    <View style={styles.controlsOverlay}>
      <View style={styles.bottomControlsContainer}>
        {progressSlot}
        <View
          style={[
            styles.bottomControls,
            isTouchLayout && styles.mobileBottomControls,
          ]}
        >
          <MediaButton
            key={`next-${focusResetKey}`}
            onPress={onPlayNextEpisode}
            disabled={!hasNextEpisode}
            hasTVPreferredFocus={deviceType === "tv"}
            forceHighlighted={highlightButtons}
            style={isTouchLayout ? styles.mobileControlButton : undefined}
          >
            <Text style={[styles.buttonText, !hasNextEpisode && styles.buttonTextDisabled]}>下集</Text>
          </MediaButton>

          <MediaButton
            onPress={playPreviousEpisode}
            disabled={!hasPreviousEpisode}
            forceHighlighted={highlightButtons}
            style={isTouchLayout ? styles.mobileControlButton : undefined}
          >
            <Text style={[styles.buttonText, !hasPreviousEpisode && styles.buttonTextDisabled]}>上集</Text>
          </MediaButton>

          <MediaButton
            onPress={() => setShowEpisodeModal(true)}
            forceHighlighted={highlightButtons}
            style={isTouchLayout ? styles.mobileControlButton : undefined}
          >
            <Text style={styles.buttonText}>选集</Text>
          </MediaButton>

          <MediaButton
            onPress={() => setShowSpeedModal(true)}
            timeLabel={playbackRate !== 1.0 ? `${playbackRate}x` : undefined}
            forceHighlighted={highlightButtons}
            style={isTouchLayout ? styles.mobileControlButton : undefined}
          >
            <Text style={styles.buttonText}>倍速</Text>
          </MediaButton>

          <MediaButton
            onPress={() => setShowSourceModal(true)}
            forceHighlighted={highlightButtons}
            style={isTouchLayout ? styles.mobileControlButton : undefined}
          >
            <Text style={styles.buttonText}>换源</Text>
          </MediaButton>

          <MediaButton
            onPress={setIntroEndTime}
            timeLabel={introEndTime ? formatTime(introEndTime) : undefined}
            forceHighlighted={highlightButtons}
            style={isTouchLayout ? styles.mobileControlButton : undefined}
          >
            <Text style={styles.buttonText}>片头</Text>
          </MediaButton>

          <MediaButton
            onPress={setOutroStartTime}
            timeLabel={outroStartTime ? formatTime(outroStartTime) : undefined}
            forceHighlighted={highlightButtons}
            style={isTouchLayout ? styles.mobileControlButton : undefined}
          >
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
    justifyContent: "flex-end",
    padding: 20,
    paddingTop: 40,
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
  mobileBottomControls: {
    width: "100%",
    justifyContent: "space-between",
    gap: 12,
  },
  mobileControlButton: {
    flexBasis: "48%",
    minWidth: "48%",
    marginBottom: 12,
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
