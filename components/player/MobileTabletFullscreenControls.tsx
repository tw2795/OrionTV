import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Heart,
  Settings,
  CornerUpLeft,
  Lock,
  Unlock,
  Smartphone,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import * as Battery from "expo-battery";
import usePlayerStore from "@/stores/playerStore";
import useDetailStore from "@/stores/detailStore";
import { formatTime } from "@/utils/formatTime";

type DeviceKind = "mobile" | "tablet";

interface MobileTabletFullscreenControlsProps {
  deviceType: DeviceKind;
  isPortrait: boolean;
  showControls: boolean;
  controlsLocked: boolean;
  onUnlockControls: () => void;
  onLockControls: () => void;
  onToggleControls: (show: boolean) => void;
  onInteract: () => void;
  onRequestExit: () => void;
  onRequestFlip?: () => void;
}

interface IconButtonProps {
  icon: LucideIcon;
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
  active?: boolean;
  size?: number;
}

const DEFAULT_KNOB_SIZE = 16;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  onPress,
  disabled = false,
  active = false,
  size = 24,
}) => {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        active && styles.iconButtonActive,
        disabled && styles.iconButtonDisabled,
        pressed && !disabled && styles.iconButtonPressed,
      ]}
    >
      <Icon color={disabled ? "#666" : active ? "#00D8A4" : "#fff"} size={size} />
      {label && <Text style={[styles.iconLabel, active && styles.iconLabelActive]}>{label}</Text>}
    </Pressable>
  );
};

const formatPercent = (value: number | null) => {
  if (value == null) return "--%";
  return `${Math.round(value * 100)}%`;
};

const MobileTabletFullscreenControls: React.FC<MobileTabletFullscreenControlsProps> = ({
  deviceType,
  isPortrait,
  showControls,
  controlsLocked,
  onUnlockControls,
  onLockControls,
  onToggleControls,
  onInteract,
  onRequestExit,
  onRequestFlip,
}) => {
  const {
    togglePlayPause,
    status,
    currentEpisodeIndex,
    episodes,
    playEpisode,
    playPreviousEpisode,
    seekToPosition,
    isSeeking,
    seekPosition,
    progressPosition,
    setShowEpisodeModal,
    setShowSourceModal,
    setShowSpeedModal,
    setIntroEndTime,
    setOutroStartTime,
    introEndTime,
    outroStartTime,
  } = usePlayerStore();
  const detailStore = useDetailStore();
  const { detail, isFavorited, toggleFavorite } = detailStore;

  const [progressWidth, setProgressWidth] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const playbackStatus = status && status.isLoaded ? status : null;
  const durationMillis = playbackStatus?.durationMillis ?? 0;
  const positionMillis = playbackStatus?.positionMillis ?? 0;
  const currentProgress = durationMillis > 0 ? (isSeeking ? seekPosition : progressPosition) : 0;
  const playableDuration = playbackStatus?.playableDurationMillis ?? 0;
  const bufferedProgress =
    durationMillis > 0
      ? Math.max(currentProgress, clamp(playableDuration / durationMillis, 0, 1))
      : currentProgress;

  const hasPreviousEpisode = currentEpisodeIndex > 0;
  const hasNextEpisode = currentEpisodeIndex < episodes.length - 1;
  const isPlaying = playbackStatus?.isPlaying ?? false;

  // System time updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  // Battery subscription
  useEffect(() => {
    let isSubscribed = true;
    Battery.getBatteryLevelAsync()
      .then((level) => {
        if (isSubscribed) setBatteryLevel(level);
      })
      .catch(() => {
        if (isSubscribed) setBatteryLevel(null);
      });

    const subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setBatteryLevel(batteryLevel);
    });

    return () => {
      isSubscribed = false;
      subscription.remove();
    };
  }, []);

  const handleProgressLayout = useCallback((event: LayoutChangeEvent) => {
    setProgressWidth(event.nativeEvent.layout.width);
  }, []);

  const handleSeekPreview = useCallback(
    (relativeX: number) => {
      if (durationMillis === 0 || progressWidth === 0) return;
      const ratio = clamp(relativeX / progressWidth, 0, 1);
      usePlayerStore.setState({ isSeeking: true, seekPosition: ratio });
    },
    [durationMillis, progressWidth]
  );

  const finalizeSeek = useCallback(
    (relativeX: number) => {
      if (durationMillis === 0 || progressWidth === 0) return;
      const ratio = clamp(relativeX / progressWidth, 0, 1);
      const targetMillis = ratio * durationMillis;
      seekToPosition(targetMillis);
    },
    [durationMillis, progressWidth, seekToPosition]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !controlsLocked,
        onMoveShouldSetPanResponder: () => !controlsLocked,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          onInteract();
          handleSeekPreview(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt: GestureResponderEvent, _gestureState: PanResponderGestureState) => {
          onInteract();
          handleSeekPreview(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: (evt: GestureResponderEvent) => {
          onInteract();
          finalizeSeek(evt.nativeEvent.locationX);
        },
        onPanResponderTerminate: (evt: GestureResponderEvent) => {
          finalizeSeek(evt.nativeEvent.locationX);
        },
      }),
    [controlsLocked, finalizeSeek, handleSeekPreview, onInteract]
  );

  const handleTogglePlay = useCallback(() => {
    onInteract();
    togglePlayPause();
  }, [onInteract, togglePlayPause]);

  const handlePlayPrevious = useCallback(() => {
    if (!hasPreviousEpisode) return;
    onInteract();
    playPreviousEpisode();
  }, [hasPreviousEpisode, onInteract, playPreviousEpisode]);

  const handlePlayNext = useCallback(() => {
    if (!hasNextEpisode) return;
    onInteract();
    playEpisode(currentEpisodeIndex + 1);
  }, [hasNextEpisode, onInteract, playEpisode, currentEpisodeIndex]);

  const handleFavorite = useCallback(() => {
    if (!detail) return;
    onInteract();
    toggleFavorite();
  }, [detail, onInteract, toggleFavorite]);

  const handleIntroToggle = useCallback(() => {
    onInteract();
    setIntroEndTime();
  }, [onInteract, setIntroEndTime]);

  const handleOutroToggle = useCallback(() => {
    onInteract();
    setOutroStartTime();
  }, [onInteract, setOutroStartTime]);

  const handleEpisodeModal = useCallback(() => {
    onInteract();
    setShowEpisodeModal(true);
  }, [onInteract, setShowEpisodeModal]);

  const handleSourceModal = useCallback(() => {
    onInteract();
    setShowSourceModal(true);
  }, [onInteract, setShowSourceModal]);

  const handleSpeedModal = useCallback(() => {
    onInteract();
    setShowSpeedModal(true);
  }, [onInteract, setShowSpeedModal]);

  const handleExit = useCallback(() => {
    onInteract();
    onRequestExit();
  }, [onInteract, onRequestExit]);

  const handleFlip = useCallback(() => {
    if (!onRequestFlip) return;
    onInteract();
    onRequestFlip();
  }, [onInteract, onRequestFlip]);

  const handleUnlock = useCallback(() => {
    onInteract();
    onUnlockControls();
    onToggleControls(true);
  }, [onInteract, onUnlockControls, onToggleControls]);

  const handleLock = useCallback(() => {
    onInteract();
    onLockControls();
  }, [onInteract, onLockControls]);

  if (controlsLocked) {
    return (
      <View style={styles.lockContainer} pointerEvents="box-none">
        <View style={styles.lockFloatingButton}>
          <IconButton icon={Unlock} onPress={handleUnlock} />
        </View>
      </View>
    );
  }

  if (!showControls) {
    return null;
  }

  const currentEpisode = episodes[currentEpisodeIndex];
  const title = detail?.title ?? "";
  const episodeLabel =
    currentEpisode?.title ??
    (currentEpisodeIndex >= 0 && episodes.length > 0 ? `第 ${currentEpisodeIndex + 1} 集` : "");
  const currentTimeLabel = formatTime(positionMillis);
  const durationLabel = formatTime(durationMillis);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={[styles.content, isPortrait && styles.contentPortrait]} pointerEvents="auto">
        <View style={styles.topRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.videoTitle} numberOfLines={1}>
              {title && episodeLabel ? `${title}：${episodeLabel}` : title || episodeLabel}
            </Text>
            {detail?.source_name ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {detail.source_name}
              </Text>
            ) : null}
          </View>
          <View style={styles.topActions}>
            <IconButton icon={Heart} onPress={handleFavorite} active={isFavorited} />
            <IconButton icon={Settings} onPress={handleSpeedModal} />
            <View style={styles.systemInfo}>
              <Text style={styles.systemInfoText}>{formatPercent(batteryLevel)}</Text>
              <Text style={styles.systemInfoText}>{formatClock(currentTime)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.centerControls}>
          <IconButton icon={SkipBack} onPress={handlePlayPrevious} disabled={!hasPreviousEpisode} size={36} />
          <IconButton icon={isPlaying ? Pause : Play} onPress={handleTogglePlay} size={48} />
          <IconButton icon={SkipForward} onPress={handlePlayNext} disabled={!hasNextEpisode} size={36} />
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.timeLabel}>{currentTimeLabel}</Text>
          <View style={styles.progressBarContainer} onLayout={handleProgressLayout} {...panResponder.panHandlers}>
            <View style={styles.progressBackground} />
            <View style={[styles.progressBuffered, { width: `${bufferedProgress * 100}%` }]} />
            <View style={[styles.progressFill, { width: `${currentProgress * 100}%` }]} />
            <View
              style={[
                styles.progressKnob,
                {
                  left: Math.max(
                    -DEFAULT_KNOB_SIZE / 2,
                    progressWidth * currentProgress - DEFAULT_KNOB_SIZE / 2
                  ),
                },
              ]}
            />
          </View>
          <Text style={styles.timeLabel}>{durationLabel}</Text>
        </View>

        <View style={styles.bottomButtonsRow}>
          <Pressable style={styles.bottomButton} onPress={handleIntroToggle}>
            <Text
              style={[
                styles.bottomButtonText,
                introEndTime !== undefined && styles.bottomButtonTextActive,
              ]}
            >
              片头
            </Text>
          </Pressable>
          <Pressable style={styles.bottomButton} onPress={handleOutroToggle}>
            <Text
              style={[
                styles.bottomButtonText,
                outroStartTime !== undefined && styles.bottomButtonTextActive,
              ]}
            >
              片尾
            </Text>
          </Pressable>
          <Pressable style={styles.bottomButton} onPress={handleEpisodeModal}>
            <Text style={styles.bottomButtonText}>选集</Text>
          </Pressable>
          <Pressable style={styles.bottomButton} onPress={handleSourceModal}>
            <Text style={styles.bottomButtonText}>换源</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.sideActionsContainer, deviceType === "mobile" && styles.sideActionsMobileOnly]}>
        <IconButton icon={CornerUpLeft} onPress={handleExit} />
        <IconButton icon={Lock} onPress={handleLock} />
        {deviceType === "mobile" && onRequestFlip ? <IconButton icon={Smartphone} onPress={handleFlip} /> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  contentPortrait: {
    paddingVertical: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  videoTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  iconButtonPressed: {
    opacity: 0.85,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  iconButtonActive: {
    backgroundColor: "rgba(0,216,164,0.18)",
    borderRadius: 999,
  },
  iconLabel: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  iconLabelActive: {
    color: "#00D8A4",
  },
  systemInfo: {
    alignItems: "flex-end",
  },
  systemInfoText: {
    color: "#fff",
    fontSize: 12,
  },
  centerControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 60,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  timeLabel: {
    color: "#fff",
    fontSize: 14,
    minWidth: 60,
    textAlign: "center",
  },
  progressBarContainer: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  progressBackground: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  progressBuffered: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  progressKnob: {
    position: "absolute",
    top: "50%",
    width: DEFAULT_KNOB_SIZE,
    height: DEFAULT_KNOB_SIZE,
    borderRadius: DEFAULT_KNOB_SIZE / 2,
    backgroundColor: "#fff",
    marginTop: -DEFAULT_KNOB_SIZE / 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  bottomButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bottomButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  bottomButtonTextActive: {
    color: "#00D8A4",
    fontWeight: "600",
  },
  sideActionsContainer: {
    position: "absolute",
    right: 24,
    top: "35%",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 24,
    padding: 6,
  },
  sideActionsMobileOnly: {
    top: "30%",
  },
  lockContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 24,
  },
  lockFloatingButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 999,
    padding: 12,
  },
});

export default MobileTabletFullscreenControls;
