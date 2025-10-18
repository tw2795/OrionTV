import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import { Unlock } from "lucide-react-native";
import usePlayerStore from "@/stores/playerStore";
import useDetailStore from "@/stores/detailStore";
import { resolveOverlayLayoutConfig } from "@/components/player/overlays/layoutConfig";
import { formatTime } from "@/utils/formatTime";
import { IconButton } from "@/components/player/overlays/shared/IconButton";
import {
  DEFAULT_KNOB_SIZE,
  clamp,
  useSystemStatus,
} from "@/components/player/overlays/shared/systemStatus";
import { baseOverlayStyles } from "@/components/player/overlays/shared/baseStyles";
import MobilePortraitOverlay from "@/components/player/overlays/MobilePortraitOverlay";
import MobilePortraitFullscreenOverlay from "@/components/player/overlays/MobilePortraitFullscreenOverlay";
import MobileLandscapeOverlay from "@/components/player/overlays/MobileLandscapeOverlay";
import TabletLandscapeOverlay from "@/components/player/overlays/TabletLandscapeOverlay";
import type {
  OverlayComponentProps,
  OverlayCommonContext,
  PlaybackControlHandlers,
  PlaybackStateSnapshot,
  ProgressSectionPayload,
  SystemStatusSnapshot,
  TitleMetadata,
} from "@/components/player/overlays/types";
import type { OverlayVariant } from "@/components/player/overlays/layoutConfig";

const overlayComponents: Record<OverlayVariant, React.FC<OverlayComponentProps>> = {
  mobilePortrait: MobilePortraitOverlay,
  mobilePortraitFullscreen: MobilePortraitFullscreenOverlay,
  mobileLandscape: MobileLandscapeOverlay,
  tabletLandscape: TabletLandscapeOverlay,
};

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
  isFullscreen?: boolean;
}

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
  isFullscreen = false,
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
  const systemStatus = useSystemStatus();

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

  const handleProgressPress = useCallback(
    (relativeX: number) => {
      if (durationMillis === 0 || progressWidth === 0) return;
      onInteract();
      handleSeekPreview(relativeX);
      finalizeSeek(relativeX);
    },
    [durationMillis, finalizeSeek, handleSeekPreview, onInteract, progressWidth]
  );

  const panResponder = PanResponder.create({
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
  });

  const currentEpisode = episodes[currentEpisodeIndex];
  const title = detail?.title ?? "";
  const episodeLabel =
    currentEpisode?.title ?? (currentEpisodeIndex >= 0 && episodes.length > 0 ? `第 ${currentEpisodeIndex + 1} 集` : "");
  const currentTimeLabel = formatTime(positionMillis);
  const durationLabel = formatTime(durationMillis);

  const topIconSize = layout === "portrait" ? 22 : 24;
  const normalizedDeviceType = deviceType === "tablet" ? "tablet" : "mobile";
  const variantConfig = resolveOverlayLayoutConfig({
    deviceType: normalizedDeviceType,
    layout,
    isFullscreen,
  });

  const shouldShowSideActions = showSideActions || variantConfig.showSideActions;
  const overlayVariant = variantConfig.variant;

  const overlayContext: OverlayCommonContext = useMemo(
    () => ({
      layout,
      variant: overlayVariant,
      deviceType: normalizedDeviceType,
      showSideActions: shouldShowSideActions,
      alignSideRailCenter: variantConfig.alignSideRailCenter,
      showBottomButtons: variantConfig.showBottomButtons,
      topIconSize,
    }),
    [
      layout,
      overlayVariant,
      normalizedDeviceType,
      shouldShowSideActions,
      variantConfig.alignSideRailCenter,
      variantConfig.showBottomButtons,
      topIconSize,
    ]
  );

  const titleMetadata: TitleMetadata = useMemo(
    () => ({
      title,
      episodeLabel,
      sourceName: detail?.source_name ?? null,
    }),
    [detail?.source_name, episodeLabel, title]
  );

  const playbackStateSnapshot: PlaybackStateSnapshot = useMemo(
    () => ({
      isPlaying,
      hasNextEpisode,
      hasPreviousEpisode,
      isFavorited,
      introMarked: introEndTime !== undefined,
      outroMarked: outroStartTime !== undefined,
    }),
    [hasNextEpisode, hasPreviousEpisode, introEndTime, isFavorited, isPlaying, outroStartTime]
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

  const handleToggleFullscreenInternal = useCallback(() => {
    if (!onToggleFullscreen) return;
    onInteract();
    onToggleFullscreen();
  }, [onInteract, onToggleFullscreen]);

  const handleUnlockControls = useCallback(() => {
    onInteract();
    onUnlockControls();
    onToggleControls(true);
  }, [onInteract, onUnlockControls, onToggleControls]);

  const progressPayload: ProgressSectionPayload = useMemo(
    () => ({
      currentTimeLabel,
      durationLabel,
      currentProgress,
      bufferedProgress,
      progressWidth,
      knobSize: DEFAULT_KNOB_SIZE,
      onProgressLayout: handleProgressLayout,
      onProgressPress: handleProgressPress,
      panHandlers: panResponder.panHandlers,
      showFullscreenToggle: layout === "portrait" && typeof onToggleFullscreen === "function",
      onToggleFullscreen: typeof onToggleFullscreen === "function" ? handleToggleFullscreenInternal : undefined,
    }),
    [
      bufferedProgress,
      currentProgress,
      currentTimeLabel,
      handleProgressLayout,
      handleProgressPress,
      handleToggleFullscreenInternal,
      layout,
      onToggleFullscreen,
      panResponder.panHandlers,
      progressWidth,
      durationLabel,
    ]
  );

  const controls: PlaybackControlHandlers = useMemo(
    () => ({
      onTogglePlay: handleTogglePlay,
      onPlayNext: handlePlayNext,
      onPlayPrevious: handlePlayPrevious,
      onFavorite: handleFavorite,
      onIntroToggle: handleIntroToggle,
      onOutroToggle: handleOutroToggle,
      onShowEpisodeModal: handleEpisodeModal,
      onShowSourceModal: handleSourceModal,
      onShowSpeedModal: handleSpeedModal,
      onLockControls,
      onUnlockControls: handleUnlockControls,
      onRequestExit: onRequestExit ? handleExit : undefined,
      onRequestFlip: onRequestFlip ? handleFlip : undefined,
      onToggleFullscreen: typeof onToggleFullscreen === "function" ? handleToggleFullscreenInternal : undefined,
    }),
    [
      handleEpisodeModal,
      handleExit,
      handleFavorite,
      handleFlip,
      handleIntroToggle,
      handleOutroToggle,
      handlePlayNext,
      handlePlayPrevious,
      handleSourceModal,
      handleSpeedModal,
      handleToggleFullscreenInternal,
      handleTogglePlay,
      handleUnlockControls,
      onLockControls,
      onRequestExit,
      onRequestFlip,
      onToggleFullscreen,
    ]
  );

  const OverlayComponent = overlayComponents[overlayVariant];
  const systemStatusSnapshot: SystemStatusSnapshot = systemStatus;

  if (controlsLocked) {
    return (
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={baseOverlayStyles.lockContainer} pointerEvents="box-none">
          <View style={baseOverlayStyles.lockButton}>
            <IconButton icon={Unlock} onPress={handleUnlockControls} size={28} />
          </View>
        </View>
      </View>
    );
  }

  if (!showControls || !OverlayComponent) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <OverlayComponent
        context={overlayContext}
        titleMetadata={titleMetadata}
        playbackState={playbackStateSnapshot}
        progress={progressPayload}
        systemStatus={systemStatusSnapshot}
        controls={controls}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default CommonPlayerOverlay;
