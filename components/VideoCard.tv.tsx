import React, { useState, useEffect, useCallback, useRef, forwardRef } from "react";
import { View, Text, Image, StyleSheet, Pressable, TouchableOpacity, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Star, Play, Trash2 } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { API } from "@/services/api";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import Logger from '@/utils/Logger';
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { DeleteType, showDeleteConfirmation, deleteRecord } from "@/utils/deleteHelpers";
import Toast from "react-native-toast-message";

const logger = Logger.withTag('VideoCardTV');

interface VideoCardProps extends React.ComponentProps<typeof TouchableOpacity> {
  id: string;
  source: string;
  title: string;
  poster: string;
  year?: string;
  rate?: string;
  sourceName?: string;
  progress?: number; // 播放进度，0-1之间的小数
  playTime?: number; // 播放时间 in ms
  episodeIndex?: number; // 剧集索引
  totalEpisodes?: number; // 总集数
  onFocus?: () => void;
  onRecordDeleted?: () => void; // 添加回调属性
  deleteType?: DeleteType; // 删除类型：'playRecord' 或 'favorite'
  isDeleteMode?: boolean; // 是否处于删除模式
  api: API;
}

const VideoCard = forwardRef<View, VideoCardProps>(
  (
    {
      id,
      source,
      title,
      poster,
      year,
      rate,
      sourceName,
      progress,
      episodeIndex,
      onFocus,
      onRecordDeleted,
      deleteType = 'playRecord', // 默认为播放记录
      isDeleteMode = false,
      api,
      playTime = 0,
    }: VideoCardProps,
    ref
  ) => {
    const router = useRouter();
    const [isFocused, setIsFocused] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    const longPressTriggered = useRef(false);

    const scale = useRef(new Animated.Value(1)).current;

    const deviceType = useResponsiveLayout().deviceType;

    const animatedStyle = {
      transform: [{ scale }],
    };

    const handlePress = async () => {
      if (longPressTriggered.current) {
        longPressTriggered.current = false;
        return;
      }

      // 如果处于删除模式，直接删除，无需确认
      if (isDeleteMode) {
        try {
          await deleteRecord({
            source,
            id,
            title,
            type: deleteType,
            onSuccess: () => {
              Toast.show({
                type: "success",
                text1: deleteType === 'playRecord' ? "已删除观看记录" : "已取消收藏",
              });
              if (onRecordDeleted) {
                onRecordDeleted();
              }
            },
            onError: (error) => {
              Toast.show({
                type: "error",
                text1: "删除失败",
                text2: error.message,
              });
            },
          });
        } catch (error) {
          logger.error("Delete record failed:", error);
        }
        return;
      }

      // 如果有播放进度，直接转到播放页面
      if (progress !== undefined && episodeIndex !== undefined) {
        router.push({
          pathname: "/play",
          params: { source, id, episodeIndex: episodeIndex - 1, title, position: playTime * 1000 },
        });
      } else {
        router.push({
          pathname: "/detail",
          params: { source, q: title },
        });
      }
    };

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      Animated.spring(scale, {
        toValue: 1.05,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
      onFocus?.();
    }, [scale, onFocus]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      Animated.spring(scale, {
        toValue: 1.0,
        useNativeDriver: true,
      }).start();
    }, [scale]);

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: Math.random() * 200, // 随机延迟创造交错效果
        useNativeDriver: true,
      }).start();
    }, [fadeAnim]);

    const handleLongPress = () => {
      // 根据删除类型决定是否允许长按删除
      // 播放记录：必须有 progress
      // 收藏：不需要 progress 检查
      if (deleteType === 'playRecord' && progress === undefined) return;

      longPressTriggered.current = true;

      // 使用统一的删除确认函数
      showDeleteConfirmation({
        source,
        id,
        title,
        type: deleteType,
        onSuccess: () => {
          // 调用删除成功回调
          if (onRecordDeleted) {
            onRecordDeleted();
          }
          // 如果没有回调函数，则使用导航刷新作为备选方案
          else if (router.canGoBack()) {
            router.replace("/");
          }
        },
      });
    };

    // 删除模式下点击删除 Layer
    const handleDeleteClick = () => {
      showDeleteConfirmation({
        source,
        id,
        title,
        type: deleteType,
        onSuccess: () => {
          if (onRecordDeleted) {
            onRecordDeleted();
          }
        },
      });
    };

    // 是否是继续观看的视频
    const isContinueWatching = progress !== undefined && progress > 0 && progress < 1;

    return (
      <Animated.View style={[styles.wrapper, animatedStyle, { opacity: fadeAnim }]}>
        <Pressable
          android_ripple={Platform.isTV || deviceType !== 'tv' ? { color: 'transparent' } : { color: Colors.dark.link }}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={({ pressed }) => [
            styles.pressable,
            {
              zIndex: pressed ? 999 : 1, // 确保按下时有最高优先级
            },
          ]}
          // activeOpacity={1}
          delayLongPress={1000}
        >
          <View style={styles.card}>
            <Image source={{ uri: api.getImageProxyUrl(poster) }} style={styles.poster} />
            {isFocused && (
              <View style={styles.overlay}>
                {isContinueWatching && (
                  <View style={styles.continueWatchingBadge}>
                    <Play size={16} color="#ffffff" fill="#ffffff" />
                    <ThemedText style={styles.continueWatchingText}>继续观看</ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* 进度条 */}
            {isContinueWatching && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${(progress || 0) * 100}%` }]} />
              </View>
            )}

            {rate && (
              <View style={styles.ratingContainer}>
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <ThemedText style={styles.ratingText}>{rate}</ThemedText>
              </View>
            )}
            {year && (
              <View style={styles.yearBadge}>
                <Text style={styles.badgeText}>{year}</Text>
              </View>
            )}
            {sourceName && (
              <View style={styles.sourceNameBadge}>
                <Text style={styles.badgeText}>{sourceName}</Text>
              </View>
            )}

            {/* 删除模式的毛玻璃 Layer - 改为普通View，不拦截焦点 */}
            {isDeleteMode && (
              <View style={styles.deleteOverlay} pointerEvents="none">
                <BlurView intensity={20} style={styles.blurView}>
                  <View style={styles.deleteContent}>
                    <Trash2 size={40} color="#ffffff" />
                    <ThemedText style={styles.deleteText}>删除</ThemedText>
                  </View>
                </BlurView>
              </View>
            )}
          </View>
          <View style={styles.infoContainer}>
            <ThemedText numberOfLines={1}>{title}</ThemedText>
            {isContinueWatching && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.continueLabel}>
                  第{episodeIndex}集 已观看 {Math.round((progress || 0) * 100)}%
                </ThemedText>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

VideoCard.displayName = "VideoCard";

export default VideoCard;

const CARD_WIDTH = 160;
const CARD_HEIGHT = 240;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 8,
  },
  pressable: {
    width: CARD_WIDTH + 20,
    height: CARD_HEIGHT + 60,
    justifyContent: 'center',
    alignItems: "center",
    overflow: "visible",
  },
  card: {
    marginTop: 10,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    backgroundColor: "#222",
    overflow: "hidden",
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderColor: Colors.dark.primary,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonRow: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  favButton: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  ratingContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  infoContainer: {
    width: CARD_WIDTH,
    marginTop: 8,
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  yearBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  sourceNameBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  progressContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.dark.primary,
  },
  continueWatchingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  continueWatchingText: {
    color: "white",
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "bold",
  },
  continueLabel: {
    color: Colors.dark.primary,
    fontSize: 12,
  },
  deleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    overflow: "hidden",
  },
  blurView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)", // 半透明背景作为兜底
  },
  deleteContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
});
