import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView } from "react-native";
import { Video } from "expo-av";
import usePlayerStore from "@/stores/playerStore";
import useDetailStore from "@/stores/detailStore";
import VideoLoadingAnimation from "@/components/VideoLoadingAnimation";
import CommonPlayerOverlay from "@/components/player/controls/CommonPlayerOverlay";

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
  const { status, playEpisode, currentEpisodeIndex, episodes, loadVideo, setControlsLocked } = usePlayerStore();
  const { detail, searchResults, setDetail } = useDetailStore();

  const joinWithSlash = (values?: (string | null | undefined)[]) =>
    values?.map((item) => item?.trim()).filter((item): item is string => !!item && item.length > 0).join(" / ") ?? "";

  const [activeTab, setActiveTab] = useState<TabKey>("episodes");

  const playbackStatus = status && status.isLoaded ? status : null;

  const handleVideoPress = useCallback(() => {
    if (controlsLocked) return;
    onToggleControls(!showControls);
    if (!showControls) {
      onInteract();
    }
  }, [controlsLocked, onInteract, onToggleControls, showControls]);

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

  const genresLabel = joinWithSlash(detail?.genres);
  const infoTags: { text: string; variant?: "source" }[] = [
    {
      text: genresLabel ? `类型：${genresLabel}` : detail?.class ? `类型：${detail.class}` : "类型未知",
    },
    { text: detail?.year ? `${detail.year}` : "年份未知" },
    { text: detail?.source_name || "来源未知", variant: "source" },
    { text: detail?.type_name ? `分类：${detail.type_name}` : "分类未知" },
  ];

  const director =
    joinWithSlash(detail?.directors) || (detail as any)?.director || "-";
  const writer =
    joinWithSlash(detail?.screenwriters) ||
    (detail as any)?.writer ||
    (detail as any)?.screenwriter ||
    "-";
  const actors = joinWithSlash(detail?.cast) || (detail as any)?.actor || "-";

  const firstAired = detail?.first_aired?.trim();
  const premiere = firstAired || "-";

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
            <Text style={styles.summaryText}>{detail?.plot_summary || "暂无简介"}</Text>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      <View style={styles.videoSection}>
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
              {(showControls || controlsLocked) && (
                <CommonPlayerOverlay
                  layout="portrait"
                  deviceType="mobile"
                  showControls={showControls}
                  controlsLocked={controlsLocked}
                  onUnlockControls={() => setControlsLocked(false)}
                  onLockControls={() => setControlsLocked(true)}
                  onToggleControls={onToggleControls}
                  onInteract={onInteract}
                  onToggleFullscreen={onToggleFullscreen}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.tagRow}>
          {infoTags.map((tag, index) => (
            <Text
              key={`${tag.text}-${index}`}
              style={[styles.tagText, tag.variant === "source" && styles.tagTextSource]}
            >
              {tag.text}
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
  tagTextSource: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
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
