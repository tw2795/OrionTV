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
  RotateCw,
  Maximize2,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import * as Battery from "expo-battery";
import usePlayerStore from "@/stores/playerStore";
import useDetailStore from "@/stores/detailStore";
import PlayerActionRail from "@/components/player/controls/PlayerActionRail";
import { formatTime } from "@/utils/formatTime";

type DeviceKind = "mobile" | "tablet";
type OverlayLayout = "portrait" | "landscape";

export interface CommonPlayerOverlayProps {
  layout: OverlayLayout;
  deviceType: DeviceKind;
  showControls: boolean;
  controlsLocked: boolean;
  onUnlockControls: () => void;
  onLockControls: () => void;
  onToggleControls: (show: boolean) => void;
  onInteract: () => void;
  onRequestExit?: () => void;
  onRequestFlip?: () => void;
  showSideActions?: boolean;
  onToggleFullscreen?: () => void;
}

interface IconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  disabled?: boolean;
  active?: boolean;
  size?: number;
  style?: any;
}

const DEFAULT_KNOB_SIZE = 16;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, onPress, disabled, active, size = 24, style }) => (
  <Pressable
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.iconButton,
      active && styles.iconButtonActive,
      disabled && styles.iconButtonDisabled,
      pressed && !disabled && styles.iconButtonPressed,
      style,
    ]}
  >
    <Icon color={disabled ? "#666" : active ? "#00D8A4" : "#fff"} size={size} />
  </Pressable>
);

const useSystemStatus = () => {
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

const formatClock = (date: Date) =>
  date.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

const BatteryIndicator: React.FC<{ level: number | null }> = ({ level }) => {
  const percentage = level != null ? clamp(level, 0, 1) : 0;
  const fillColor =
    percentage >= 0.5 ? "#00D8A4" : percentage >= 0.2 ? "#FFB020" : "#FF5F5F";

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

export const CommonPlayerOverlay: React.FC<CommonPlayerOverlayProps> = ({
  layout,
  deviceType,
  showControls,
  controlsLocked,
  onUnlockControls,
  onLockControls,
  onToggleControls,
  onInteract,
  onRequestExit,
  onRequestFlip,
  showSideActions = false,
  onToggleFullscreen,
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
  const { batteryLevel, currentTime } = useSystemStatus();

  const playbackStatus = status && status.isLoaded ? status : null;
  const durationMillis = playbackStatus?.durationMillis ?? 0;
  const positionMillis = playbackStatus?.positionMillis ?? 0;
  const currentProgress = durationMillis > 0 ? (isSeeking ? seekPosition : progressPosition) : 0;
  const playableDuration = playbackStatus?.playableDurationMillis ?? 0;
  const bufferedProgress =
    durationMillis > 0 ? Math.max(currentProgress, clamp(playableDuration / durationMillis, 0, 1)) : currentProgress;

  const hasPreviousEpisode = currentEpisodeIndex > 0;
  const hasNextEpisode = currentEpisodeIndex < episodes.length - 1;
  const isPlaying = playbackStatus?.isPlaying ?? false;

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
          if (typeof evt.stopPropagation === "function") {
            evt.stopPropagation();
          }
          onInteract();
          handleSeekPreview(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt: GestureResponderEvent, _gestureState: PanResponderGestureState) => {
          if (typeof evt.stopPropagation === "function") {
            evt.stopPropagation();
          }
          onInteract();
          handleSeekPreview(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: (evt: GestureResponderEvent) => {
          if (typeof evt.stopPropagation === "function") {
            evt.stopPropagation();
          }
          onInteract();
          finalizeSeek(evt.nativeEvent.locationX);
        },
        onPanResponderTerminate: (evt: GestureResponderEvent) => {
          if (typeof evt.stopPropagation === "function") {
            evt.stopPropagation();
          }
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
  }, [currentEpisodeIndex, hasNextEpisode, onInteract, playEpisode]);

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
    if (!onRequestExit) return;
    onInteract();
    onRequestExit();
  }, [onInteract, onRequestExit]);

  const handleFlip = useCallback(() => {
    if (!onRequestFlip) return;
    onInteract();
    onRequestFlip();
  }, [onInteract, onRequestFlip]);

  const handleUnlockControls = useCallback(() => {
    onInteract();
    onUnlockControls();
    onToggleControls(true);
  }, [onInteract, onUnlockControls, onToggleControls]);

  const currentEpisode = episodes[currentEpisodeIndex];
  const title = detail?.title ?? "";
  const episodeLabel =
    currentEpisode?.title ?? (currentEpisodeIndex >= 0 && episodes.length > 0 ? `第 ${currentEpisodeIndex + 1} 集` : "");
  const currentTimeLabel = formatTime(positionMillis);
  const durationLabel = formatTime(durationMillis);

  const topIconSize = layout === "portrait" ? 22 : 24;
  const shouldShowBottomButtons = !(deviceType === "mobile" && layout === "portrait");

  if (controlsLocked) {
    return (
      <View style={styles.lockContainer} pointerEvents="box-none">
        <View style={styles.lockFloatingButton}>
          <IconButton icon={Unlock} onPress={handleUnlockControls} size={28} />
        </View>
      </View>
    );
  }

  if (!showControls) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={[styles.content, layout === "portrait" ? styles.contentPortrait : styles.contentLandscape]} pointerEvents="auto">
        <View style={styles.topRow}>
          <View style={styles.titleContainer}>
            <Text style={[styles.videoTitle, layout === "portrait" && styles.videoTitlePortrait]} numberOfLines={1}>
              {title && episodeLabel ? `${title}：${episodeLabel}` : title || episodeLabel}
            </Text>
            {detail?.source_name ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {detail.source_name}
              </Text>
            ) : null}
          </View>
          <View style={styles.topActions}>
            <IconButton icon={Heart} onPress={handleFavorite} active={isFavorited} size={topIconSize} />
            <IconButton icon={Settings} onPress={handleSpeedModal} size={topIconSize} />
            <View style={styles.systemInfo}>
              <BatteryIndicator level={batteryLevel} />
              <Text style={styles.systemInfoTime}>{formatClock(currentTime)}</Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.centerControlsWrapper,
            layout === "portrait" ? styles.centerControlsPortrait : styles.centerControlsLandscape,
          ]}
        >
          <IconButton icon={SkipBack} onPress={handlePlayPrevious} disabled={!hasPreviousEpisode} size={layout === "portrait" ? 40 : 44} />
          <IconButton icon={isPlaying ? Pause : Play} onPress={handleTogglePlay} size={layout === "portrait" ? 56 : 60} />
          <IconButton icon={SkipForward} onPress={handlePlayNext} disabled={!hasNextEpisode} size={layout === "portrait" ? 40 : 44} />
        </View>

        <View
          style={[
            styles.bottomSection,
            layout === "portrait" ? styles.bottomSectionPortrait : styles.bottomSectionLandscape,
          ]}
        >
          <View style={styles.progressSection}>
            <Text style={[styles.timeLabel, layout === "portrait" && styles.timeLabelPortrait]}>{currentTimeLabel}</Text>
              <Pressable
                style={styles.progressBarContainer}
                onLayout={handleProgressLayout}
                onPress={(event) => {
                  if (typeof event.stopPropagation === "function") {
                    event.stopPropagation();
                  }
                  onInteract();
                  const locationX = event.nativeEvent.locationX;
                  handleSeekPreview(locationX);
                  finalizeSeek(locationX);
                }}
                {...panResponder.panHandlers}
              >
                <View style={styles.progressBackground} />
                <View style={[styles.progressBuffered, { width: `${bufferedProgress * 100}%` }]} />
                <View style={[styles.progressFill, { width: `${currentProgress * 100}%` }]} />
                <View
                  style={[
                  styles.progressKnob,
                  {
                    left: Math.max(-DEFAULT_KNOB_SIZE / 2, progressWidth * currentProgress - DEFAULT_KNOB_SIZE / 2),
                  },
                ]}
              />
              </Pressable>
            <Text style={[styles.timeLabel, layout === "portrait" && styles.timeLabelPortrait]}>{durationLabel}</Text>
            {layout === "portrait" && onToggleFullscreen ? (
              <IconButton icon={Maximize2} onPress={() => {
                onInteract();
                onToggleFullscreen();
              }} size={20} />
            ) : null}
          </View>

          {shouldShowBottomButtons ? (
            <View style={styles.bottomButtonsRow}>
              <Pressable style={styles.bottomButton} onPress={handleIntroToggle}>
                <Text style={[styles.bottomButtonText, introEndTime !== undefined && styles.bottomButtonTextActive]}>片头</Text>
              </Pressable>
              <Pressable style={styles.bottomButton} onPress={handleOutroToggle}>
                <Text style={[styles.bottomButtonText, outroStartTime !== undefined && styles.bottomButtonTextActive]}>片尾</Text>
              </Pressable>
              <Pressable style={styles.bottomButton} onPress={handleEpisodeModal}>
                <Text style={styles.bottomButtonText}>选集</Text>
              </Pressable>
              <Pressable style={styles.bottomButton} onPress={handleSourceModal}>
                <Text style={styles.bottomButtonText}>换源</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {showSideActions ? (
        <PlayerActionRail isPortrait={layout === "portrait"}>
          {onRequestExit ? <IconButton icon={CornerUpLeft} onPress={handleExit} size={26} /> : null}
          <IconButton icon={Lock} onPress={onLockControls} size={24} />
          {deviceType === "mobile" && onRequestFlip ? <IconButton icon={RotateCw} onPress={handleFlip} size={24} /> : null}
        </PlayerActionRail>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  contentLandscape: {
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 18,
  },
  contentPortrait: {
    justifyContent: "space-between",
    paddingVertical: 14,
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
  videoTitlePortrait: {
    fontSize: 18,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 4,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  systemInfo: {
    alignItems: "flex-end",
    gap: 4,
  },
  systemInfoTime: {
    color: "#fff",
    fontSize: 12,
  },
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
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderRadius: 999,
  },
  iconButtonPressed: {
    opacity: 0.9,
  },
  iconButtonDisabled: {
    opacity: 0.35,
  },
  iconButtonActive: {
    backgroundColor: "rgba(0,216,164,0.18)",
  },
  centerControlsWrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 48,
    alignSelf: "center",
  },
  centerControlsLandscape: {
    marginTop: 12,
  },
  centerControlsPortrait: {
    marginTop: 24,
    gap: 36,
  },
  bottomSection: {
    gap: 16,
  },
  bottomSectionLandscape: {
    paddingBottom: 18,
    gap: 16,
  },
  bottomSectionPortrait: {
    paddingBottom: 4,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  timeLabel: {
    color: "#fff",
    fontSize: 14,
    minWidth: 52,
    textAlign: "center",
  },
  timeLabelPortrait: {
    fontSize: 12,
    minWidth: 44,
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
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  bottomButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  bottomButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  bottomButtonTextActive: {
    color: "#00D8A4",
    fontWeight: "600",
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

export default CommonPlayerOverlay;
