import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { GestureResponderHandlers, LayoutChangeEvent } from "react-native";
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
          <CenterPlayOverlay />
          <PlayerControls
            showControls={showControls}
            setShowControls={setShowControls}
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
