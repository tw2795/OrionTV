import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, findNodeHandle } from "react-native";
import type { GestureResponderHandlers, LayoutChangeEvent, View as RNView } from "react-native";
import type { AVPlaybackStatus, AVPlaybackStatusSuccess } from "expo-av";

import { CenterPlayOverlay } from "@/components/CenterPlayOverlay";
import { PlayerControls } from "@/components/PlayerControls";
import { SeekingBar } from "@/components/SeekingBar";
import TopBar from "@/components/player/overlays/shared/TopBar";
import ProgressSection from "@/components/player/overlays/shared/ProgressSection";
import usePlayerStore from "@/stores/playerStore";
import useDetailStore from "@/stores/detailStore";
import { useSystemStatus, DEFAULT_KNOB_SIZE } from "@/components/player/overlays/shared/systemStatus";
import { formatTime } from "@/utils/formatTime";
import type {
  OverlayCommonContext,
  PlaybackControlHandlers,
  PlaybackStateSnapshot,
  ProgressSectionPayload,
  TitleMetadata,
} from "@/components/player/overlays/types";

interface TvOverlayProps {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
}

const toLoadedStatus = (status: AVPlaybackStatus | null): AVPlaybackStatusSuccess | null => {
  if (status && status.isLoaded) {
    return status as AVPlaybackStatusSuccess;
  }
  return null;
};

const TvOverlay: React.FC<TvOverlayProps> = ({ showControls, setShowControls }) => {
  const {
    status,
    isSeeking,
    seekPosition,
    progressPosition,
    currentEpisodeIndex,
    episodes,
    playEpisode,
    playPreviousEpisode,
    setShowSpeedModal,
  } = usePlayerStore();
  const { detail, isFavorited, toggleFavorite } = useDetailStore();
  const systemStatus = useSystemStatus();

  const [progressWidth, setProgressWidth] = useState(0);
  const [focusZone, setFocusZone] = useState<"center" | "top" | "bottom">("center");
  const playButtonRef = useRef<RNView>(null);
  const [playButtonHandle, setPlayButtonHandle] = useState<number | null>(null);
  const [topFirstHandle, setTopFirstHandle] = useState<number | null>(null);
  const [bottomFirstHandle, setBottomFirstHandle] = useState<number | null>(null);

  const loadedStatus = useMemo(() => toLoadedStatus(status), [status]);
  const durationMillis = loadedStatus?.durationMillis ?? 0;
  const positionMillis = loadedStatus?.positionMillis ?? 0;
  const playableDuration = loadedStatus?.playableDurationMillis ?? 0;
  const currentProgress = durationMillis > 0 ? (isSeeking ? seekPosition : progressPosition) : 0;
  const bufferedProgress =
    durationMillis > 0 ? Math.max(currentProgress, Math.min(playableDuration / durationMillis, 1)) : currentProgress;

  const handleProgressLayout = useCallback((event: LayoutChangeEvent) => {
    setProgressWidth(event.nativeEvent.layout.width);
  }, []);

  const progressHandlers = useMemo<GestureResponderHandlers>(() => ({} as GestureResponderHandlers), []);

  const overlayContext = useMemo<OverlayCommonContext>(
    () => ({
      layout: "landscape",
      variant: "mobileLandscape",
      deviceType: "tablet",
      showSideActions: false,
      alignSideRailCenter: false,
      showBottomButtons: false,
      topIconSize: 28,
    }),
    [],
  );

  const titleMetadata: TitleMetadata = useMemo(() => {
    const title = detail?.title ?? "";
    const episode =
      episodes[currentEpisodeIndex]?.title ??
      (episodes.length > 0 ? `第 ${Math.max(currentEpisodeIndex + 1, 1)} 集` : "");
    return {
      title,
      episodeLabel: episode,
      sourceName: detail?.source_name ?? null,
    };
  }, [detail?.source_name, detail?.title, episodes, currentEpisodeIndex]);

  useEffect(() => {
    if (showControls) {
      setFocusZone("center");
    }
  }, [showControls]);

  useEffect(() => {
    if (!showControls) {
      setPlayButtonHandle(null);
      setTopFirstHandle(null);
      setBottomFirstHandle(null);
      return;
    }
    const handle = playButtonRef.current ? findNodeHandle(playButtonRef.current) : null;
    setPlayButtonHandle(handle ?? null);
  }, [showControls, loadedStatus?.isPlaying]);

  const handleCenterFocus = useCallback(() => setFocusZone("center"), []);
  const handleTopFocus = useCallback(() => setFocusZone("top"), []);
  const handleBottomFocus = useCallback(() => setFocusZone("bottom"), []);
  const handleRegisterTop = useCallback((handle: number | null) => setTopFirstHandle(handle ?? null), []);
  const handleRegisterBottom = useCallback((handle: number | null) => setBottomFirstHandle(handle ?? null), []);

  const centerFocusProps = useMemo(
    () => ({
      hasTVPreferredFocus: focusZone === "center",
      nextFocusUp: (topFirstHandle ?? playButtonHandle) ?? undefined,
      nextFocusDown: (bottomFirstHandle ?? playButtonHandle) ?? undefined,
      nextFocusLeft: playButtonHandle ?? undefined,
      nextFocusRight: playButtonHandle ?? undefined,
    }),
    [focusZone, topFirstHandle, bottomFirstHandle, playButtonHandle],
  );

  const playbackStateSnapshot: PlaybackStateSnapshot = useMemo(
    () => ({
      isPlaying: loadedStatus?.isPlaying ?? false,
      hasNextEpisode: currentEpisodeIndex < episodes.length - 1,
      hasPreviousEpisode: currentEpisodeIndex > 0,
      isFavorited,
      introMarked: false,
      outroMarked: false,
    }),
    [loadedStatus, currentEpisodeIndex, episodes.length, isFavorited],
  );

  const controls = useMemo<PlaybackControlHandlers>(
    () => ({
      onTogglePlay: () => {},
      onPlayNext: () => {
        if (currentEpisodeIndex < episodes.length - 1) {
          playEpisode(currentEpisodeIndex + 1);
        }
      },
      onPlayPrevious: () => {
        if (currentEpisodeIndex > 0) {
          playPreviousEpisode();
        }
      },
      onFavorite: () => {
        if (!detail) return;
        toggleFavorite();
      },
      onIntroToggle: () => {},
      onOutroToggle: () => {},
      onShowEpisodeModal: () => {},
      onShowSourceModal: () => {},
      onShowSpeedModal: () => setShowSpeedModal(true),
      onLockControls: () => {},
      onUnlockControls: () => {},
    }),
    [currentEpisodeIndex, detail, episodes.length, playEpisode, playPreviousEpisode, setShowSpeedModal, toggleFavorite],
  );

  const progressPayload = useMemo<ProgressSectionPayload>(
    () => ({
      currentTimeLabel: formatTime(positionMillis),
      durationLabel: formatTime(durationMillis),
      currentProgress,
      bufferedProgress,
      progressWidth,
      knobSize: DEFAULT_KNOB_SIZE,
      onProgressLayout: handleProgressLayout,
      onProgressPress: () => {},
      panHandlers: progressHandlers,
      showFullscreenToggle: false,
    }),
    [bufferedProgress, currentProgress, durationMillis, handleProgressLayout, positionMillis, progressHandlers, progressWidth],
  );

  return (
    <>
      {showControls && (
        <>
          <CenterPlayOverlay
            ref={playButtonRef}
            tvAutoFocus={focusZone === "center"}
            onTVFocus={handleCenterFocus}
            tvFocusProps={centerFocusProps}
          />
          <PlayerControls
            showControls={showControls}
            setShowControls={setShowControls}
            onBottomFocus={handleBottomFocus}
            nextFocusUpTarget={playButtonHandle}
            onRegisterFirstButton={handleRegisterBottom}
            progressSlot={
              <View style={styles.progressWrapper}>
                <ProgressSection context={overlayContext} progress={progressPayload} />
              </View>
            }
          />
          <View style={styles.topBarWrapper} pointerEvents="box-none">
            <TopBar
              context={overlayContext}
              title={titleMetadata}
              systemStatus={systemStatus}
              playbackState={playbackStateSnapshot}
              controls={controls}
              showSettingsButton={false}
              showBatteryStatus={false}
              focusConfig={{
                nextFocusDown: playButtonHandle,
                onActionFocus: handleTopFocus,
                onRegisterFirstAction: handleRegisterTop,
              }}
            />
          </View>
        </>
      )}
      <SeekingBar />
    </>
  );
};

const styles = StyleSheet.create({
  topBarWrapper: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 48,
    paddingTop: 32,
    justifyContent: "flex-start",
  },
  progressWrapper: {
    width: "100%",
    marginBottom: 20,
  },
});

export default TvOverlay;
