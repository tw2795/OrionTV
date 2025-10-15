import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  LayoutChangeEvent,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  ScrollView,
} from "react-native";
import { Video } from "expo-av";
import { Maximize2, Heart, Settings, SkipBack, SkipForward, Play, Pause } from "lucide-react-native";
import usePlayerStore from "@/stores/playerStore";
import useDetailStore from "@/stores/detailStore";
import { formatTime } from "@/utils/formatTime";
import VideoLoadingAnimation from "@/components/VideoLoadingAnimation";

const DEFAULT_KNOB_SIZE = 14;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type TabKey = "episodes" | "sources" | "summary";

interface MobilePortraitPlayerProps {
  videoRef: React.RefObject<Video>;
  videoProps: any;
  isVideoReady: boolean;
  isLoading: boolean;
  showControls: boolean;
  controlsLocked: boolean;
  onToggleControls: (show: boolean) => void;
  onInteract: () => void;
  onToggleFullscreen: () => void;
}

export const MobilePortraitPlayer: React.FC<MobilePortraitPlayerProps> = ({
  videoRef,
  videoProps,
  isVideoReady,
  isLoading,
  showControls,
  controlsLocked,
  onToggleControls,
  onInteract,
  onToggleFullscreen,
}) => {
  const {
    status,
    togglePlayPause,
    playPreviousEpisode,
    playEpisode,
    seekToPosition,
    currentEpisodeIndex,
    episodes,
    progressPosition,
    isSeeking,
    seekPosition,
    loadVideo,
    setShowSpeedModal,
  } = usePlayerStore();
  const { detail, toggleFavorite, isFavorited, searchResults, setDetail } = useDetailStore();

  const [progressWidth, setProgressWidth] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>("episodes");

  const playbackStatus = status && status.isLoaded ? status : null;
  const durationMillis = playbackStatus?.durationMillis ?? 0;
  const positionMillis = playbackStatus?.positionMillis ?? 0;
  const currentProgress = durationMillis > 0 ? (isSeeking ? seekPosition : progressPosition) : 0;
  const playableDuration = playbackStatus?.playableDurationMillis ?? 0;
  const bufferedProgress =
    durationMillis > 0
      ? Math.max(currentProgress, clamp(playableDuration / durationMillis, 0, 1))
      : currentProgress;
  const isPlaying = playbackStatus?.isPlaying ?? false;

  const currentEpisode = episodes[currentEpisodeIndex];
  const episodeLabel =
    currentEpisode?.title ??
    (currentEpisodeIndex >= 0 ? `第 ${currentEpisodeIndex + 1} 集` : detail?.title ?? "");
  const titleLabel = detail ? `${detail.title}：${episodeLabel}` : episodeLabel;

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
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
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
    [finalizeSeek, handleSeekPreview, onInteract]
  );

  const handleVideoPress = useCallback(() => {
    if (controlsLocked) return;
    onToggleControls(!showControls);
    if (!showControls) {
      onInteract();
    }
  }, [controlsLocked, onInteract, onToggleControls, showControls]);

  const handlePlayNext = useCallback(() => {
    if (currentEpisodeIndex < episodes.length - 1) {
      playEpisode(currentEpisodeIndex + 1);
    }
  }, [currentEpisodeIndex, episodes.length, playEpisode]);

  const handleSelectEpisode = useCallback(
    (index: number) => {
      if (index !== currentEpisodeIndex) {
        onInteract();
        playEpisode(index);
      }
    },
    [currentEpisodeIndex, onInteract, playEpisode]
  );

  const handleSelectSource = useCallback(
    async (index: number) => {
      if (!searchResults[index] || !detail) return;
      const target = searchResults[index];
      if (target.source === detail.source) return;

      onInteract();
      const currentPosition = playbackStatus?.isLoaded ? playbackStatus.positionMillis : undefined;
      await setDetail(target);
      loadVideo({
        source: target.source,
        id: target.id.toString(),
        episodeIndex: currentEpisodeIndex,
        title: target.title,
        position: currentPosition,
      });
    },
    [currentEpisodeIndex, detail, loadVideo, playbackStatus, searchResults, setDetail]
  );

  const infoTags = [
    detail?.class ?? "类型未知",
    detail?.year ? `${detail.year}` : "年份未知",
    detail?.source_name ? `来源：${detail.source_name}` : "来源未知",
    detail?.type_name ? `分类：${detail.type_name}` : "分类未知",
  ];

  const director = (detail as any)?.director || "-";
  const writer = (detail as any)?.writer || (detail as any)?.screenwriter || "-";
  const actors = (detail as any)?.actor || "-";
  const premiere = (detail as any)?.first_play || (detail as any)?.release_date || "-";

  useEffect(() => {
    setActiveTab("episodes");
  }, [detail?.source]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "episodes":
        return (
          <View style={styles.cardContainer}>
            {episodes.map((episode, index) => {
              const isActive = index === currentEpisodeIndex;
              return (
                <Pressable
                  key={episode.title || index}
                  style={[styles.cardItem, isActive && styles.cardItemActive]}
                  onPress={() => handleSelectEpisode(index)}
                >
                  <Text style={[styles.cardItemText, isActive && styles.cardItemTextActive]}>
                    {episode.title || `第 ${index + 1} 集`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      case "sources":
        return (
          <View style={styles.cardContainer}>
            {searchResults.map((item, index) => {
              const isActive = detail?.source === item.source;
              return (
                <Pressable
                  key={`${item.source}-${index}`}
                  style={[styles.cardItem, isActive && styles.cardItemActive]}
                  onPress={() => handleSelectSource(index)}
                >
                  <Text style={[styles.cardItemText, isActive && styles.cardItemTextActive]} numberOfLines={1}>
                    {item.source_name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      case "summary":
        return (
          <ScrollView style={styles.summaryContainer} nestedScrollEnabled>
            <Text style={styles.summaryText}>{detail?.desc || "暂无简介"}</Text>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      <View style={styles.videoSection}>
        {showControls && (
          <View style={styles.topRow}>
            <Text style={styles.titleText} numberOfLines={1}>
              {titleLabel}
            </Text>
            <View style={styles.topActions}>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  onInteract();
                  toggleFavorite();
                }}
              >
                <Heart color={isFavorited ? "#ff5f5f" : "#fff"} fill={isFavorited ? "#ff5f5f" : "none"} size={22} />
                <Text style={styles.actionLabel}>收藏</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  onInteract();
                  setShowSpeedModal(true);
                }}
              >
                <Settings color="#fff" size={22} />
                <Text style={styles.actionLabel}>设置</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.videoWrapper}>
          <View style={styles.videoContainer}>
            <View style={styles.videoSurface}>
              <TouchableOpacity style={styles.videoTouchable} activeOpacity={1} onPress={handleVideoPress}>
                {isVideoReady ? (
                  <Video ref={videoRef} style={styles.videoInner} {...videoProps} />
                ) : (
                  <View style={styles.videoFallback}>
                    <VideoLoadingAnimation showProgressBar />
                  </View>
                )}
                {isVideoReady && isLoading && (
                  <View style={styles.videoLoadingOverlay}>
                    <VideoLoadingAnimation showProgressBar />
                  </View>
                )}
              </TouchableOpacity>
              {showControls && (
                <View style={styles.centerControls}>
                  <Pressable
                    style={styles.centerButton}
                    onPress={() => {
                      onInteract();
                      playPreviousEpisode();
                    }}
                    disabled={currentEpisodeIndex <= 0}
                  >
                    <SkipBack color={currentEpisodeIndex <= 0 ? "#666" : "#fff"} size={28} />
                  </Pressable>
                  <Pressable
                    style={styles.centerButton}
                    onPress={() => {
                      onInteract();
                      togglePlayPause();
                    }}
                  >
                    {isPlaying ? <Pause color="#fff" size={36} /> : <Play color="#fff" size={36} fill="#fff" />}
                  </Pressable>
                  <Pressable
                    style={styles.centerButton}
                    onPress={() => {
                      onInteract();
                      handlePlayNext();
                    }}
                    disabled={currentEpisodeIndex >= episodes.length - 1}
                  >
                    <SkipForward color={currentEpisodeIndex >= episodes.length - 1 ? "#666" : "#fff"} size={28} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {showControls && (
            <View style={styles.progressRow}>
              <Text style={styles.timeLabel}>{formatTime(positionMillis)}</Text>
              <View style={styles.progressBarContainer} onLayout={handleProgressLayout} {...panResponder.panHandlers}>
                <View style={styles.progressBackground} />
                <View style={[styles.progressBuffered, { width: `${bufferedProgress * 100}%` }]} />
                <View style={[styles.progressFill, { width: `${currentProgress * 100}%` }]} />
                <View
                  style={[
                    styles.progressKnob,
                    { left: Math.max(-DEFAULT_KNOB_SIZE / 2, progressWidth * currentProgress - DEFAULT_KNOB_SIZE / 2) },
                  ]}
                />
              </View>
              <Text style={styles.timeLabel}>{formatTime(durationMillis)}</Text>
              <Pressable
                style={styles.fullscreenButton}
                onPress={() => {
                  onInteract();
                  onToggleFullscreen();
                }}
              >
                <Maximize2 color="#fff" size={22} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.tagRow}>
          {infoTags.map((tag, index) => (
            <Text key={`${tag}-${index}`} style={styles.tagText}>
              {tag}
            </Text>
          ))}
        </View>

        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>导演：</Text>
          <Text style={styles.infoValue}>{director}</Text>
        </View>
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>编剧：</Text>
          <Text style={styles.infoValue}>{writer}</Text>
        </View>
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>主演：</Text>
          <Text style={styles.infoValue}>{actors}</Text>
        </View>
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>首播：</Text>
          <Text style={styles.infoValue}>{premiere}</Text>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabButton, activeTab === "episodes" && styles.tabButtonActive]}
            onPress={() => {
              onInteract();
              setActiveTab("episodes");
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === "episodes" && styles.tabButtonTextActive]}>选集</Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === "sources" && styles.tabButtonActive]}
            onPress={() => {
              onInteract();
              setActiveTab("sources");
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === "sources" && styles.tabButtonTextActive]}>换源</Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === "summary" && styles.tabButtonActive]}
            onPress={() => {
              onInteract();
              setActiveTab("summary");
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === "summary" && styles.tabButtonTextActive]}>简介</Text>
          </Pressable>
        </View>

        <View style={styles.tabContent}>{renderTabContent()}</View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerContent: {
    paddingBottom: 24,
  },
  videoSection: {
    backgroundColor: "#000",
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 16,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    alignItems: "center",
  },
  actionLabel: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  videoWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  videoContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  videoSurface: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  videoTouchable: {
    aspectRatio: 16 / 9,
    backgroundColor: "#111",
  },
  videoInner: {
    width: "100%",
    height: "100%",
  },
  videoFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  centerControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "10%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
  },
  centerButton: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 32,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 32,
  },
  timeLabel: {
    color: "#fff",
    fontSize: 12,
    minWidth: 44,
    textAlign: "center",
  },
  progressBarContainer: {
    flex: 1,
    height: 24,
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
  fullscreenButton: {
    padding: 6,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tagText: {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  infoLine: {
    flexDirection: "row",
    marginTop: 6,
  },
  infoLabel: {
    color: "#fff",
    width: 48,
    fontSize: 13,
  },
  infoValue: {
    color: "rgba(255,255,255,0.85)",
    flex: 1,
    fontSize: 13,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 12,
  },
  tabButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  tabButtonActive: {
    backgroundColor: "#00D8A4",
  },
  tabButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: "#0b0b0b",
  },
  tabContent: {
    minHeight: 140,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  cardItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cardItemActive: {
    backgroundColor: "#00D8A4",
  },
  cardItemText: {
    color: "#fff",
    fontSize: 14,
  },
  cardItemTextActive: {
    color: "#0b0b0b",
    fontWeight: "600",
  },
  summaryContainer: {
    maxHeight: 200,
  },
  summaryText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
  },
});

export default MobilePortraitPlayer;
