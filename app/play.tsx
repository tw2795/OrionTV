import React, { useEffect, useRef, useCallback, memo, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, BackHandler, AppState, AppStateStatus, View, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video } from "expo-av";
import { useKeepAwake } from "expo-keep-awake";
import * as ScreenOrientation from "expo-screen-orientation";
import { ThemedView } from "@/components/ThemedView";
import TvOverlay from "@/components/player/overlays/TvOverlay";
import { EpisodeSelectionModal } from "@/components/EpisodeSelectionModal";
import { SourceSelectionModal } from "@/components/SourceSelectionModal";
import { SpeedSelectionModal } from "@/components/SpeedSelectionModal";
import MobileTabletFullscreenControls from "@/components/player/MobileTabletFullscreenControls";
import MobilePortraitPlayer from "@/components/player/MobilePortraitPlayer";
// import { NextEpisodeOverlay } from "@/components/NextEpisodeOverlay";
import VideoLoadingAnimation from "@/components/VideoLoadingAnimation";
import useDetailStore from "@/stores/detailStore";
import { useTVRemoteHandler } from "@/hooks/useTVRemoteHandler";
import Toast from "react-native-toast-message";
import usePlayerStore, { selectCurrentEpisode } from "@/stores/playerStore";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useVideoHandlers } from "@/hooks/useVideoHandlers";
import Logger from "@/utils/Logger";

const logger = Logger.withTag('PlayScreen');

// 优化的加载动画组件
const LoadingContainer = memo(
  ({ style, currentEpisode }: { style: any; currentEpisode: { url: string; title: string } | undefined }) => {
    logger.info(
      `[PERF] Video component NOT rendered - waiting for valid URL. currentEpisode: ${!!currentEpisode}, url: ${
        currentEpisode?.url ? "exists" : "missing"
      }`
    );
    return (
      <View style={style}>
        <VideoLoadingAnimation showProgressBar />
      </View>
    );
  }
);

LoadingContainer.displayName = "LoadingContainer";

// 移到组件外部避免重复创建
const createResponsiveStyles = (deviceType: string) => {
  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "black",
      // 移动端和平板端可能需要状态栏处理
      ...(isMobile || isTablet ? { paddingTop: 0 } : {}),
    },
    videoContainer: {
      ...StyleSheet.absoluteFillObject,
      // 为触摸设备添加更多的交互区域
      ...(isMobile || isTablet ? { zIndex: 1 } : {}),
    },
    videoPlayer: {
      ...StyleSheet.absoluteFillObject,
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
  });
};

export default function PlayScreen() {
  const videoRef = useRef<Video>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  useKeepAwake();

  // 响应式布局配置
  const { deviceType, isPortrait } = useResponsiveLayout();
  const initialDeviceTypeRef = useRef(deviceType);
  const isBaselineMobile = initialDeviceTypeRef.current === "mobile";
  const [mobileFullscreenMode, setMobileFullscreenMode] = useState(() => isBaselineMobile && !isPortrait);

  const {
    episodeIndex: episodeIndexStr,
    position: positionStr,
    source: sourceStr,
    id: videoId,
    title: videoTitle,
  } = useLocalSearchParams<{
    episodeIndex: string;
    position?: string;
    source?: string;
    id?: string;
    title?: string;
  }>();
  const episodeIndex = parseInt(episodeIndexStr || "0", 10);
  const position = positionStr ? parseInt(positionStr, 10) : undefined;

  const { detail } = useDetailStore();
  const source = sourceStr || detail?.source;
  const id = videoId || detail?.id.toString();
  const title = videoTitle || detail?.title;
  const {
    isLoading,
    showControls,
    controlsLocked,
    // showNextEpisodeOverlay,
    initialPosition,
    introEndTime,
    playbackRate,
    status,
    setVideoRef,
    handlePlaybackStatusUpdate,
    setShowControls,
    setControlsLocked,
    // setShowNextEpisodeOverlay,
    reset,
    loadVideo,
  } = usePlayerStore();
  const currentEpisode = usePlayerStore(selectCurrentEpisode);

  // 使用Video事件处理hook
  const { videoProps } = useVideoHandlers({
    videoRef,
    currentEpisode,
    initialPosition,
    introEndTime,
    playbackRate,
    handlePlaybackStatusUpdate,
    deviceType,
    detail: detail || undefined,
  });

  // TV遥控器处理 - 总是调用hook，但根据设备类型决定是否使用结果
  const tvRemoteHandler = useTVRemoteHandler();

  // 优化的动态样式 - 使用useMemo避免重复计算
  const dynamicStyles = useMemo(() => createResponsiveStyles(deviceType), [deviceType]);
  const handleToggleFullscreen = useCallback(async () => {
    if (isBaselineMobile) {
      if (Platform.OS !== "android" && Platform.OS !== "ios") return;

      try {
        if (isPortrait) {
          setMobileFullscreenMode(true);
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          setMobileFullscreenMode(false);
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch (error) {
        logger.warn(`[UI] Failed to toggle fullscreen orientation`, error);
      }
      return;
    }

    if (!videoRef.current) return;
    try {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        await videoRef.current.presentFullscreenPlayer();
      } else if (typeof (videoRef.current as any).presentFullscreenPlayer === "function") {
        await (videoRef.current as any).presentFullscreenPlayer();
      }
    } catch (error) {
      logger.warn(`[UI] Failed to enter fullscreen`, error);
    }
  }, [isBaselineMobile, isPortrait]);

  // Helper function to reset hide controls timer
  const resetHideControlsTimer = useCallback(() => {
    if (deviceType === "tv") {
      return;
    }
    if (usePlayerStore.getState().controlsLocked) {
      return;
    }
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000); // 3 seconds
  }, [deviceType, setShowControls]);

  const handleToggleControlsVisibility = useCallback(
    (show: boolean) => {
      if (show) {
        setShowControls(true);
        resetHideControlsTimer();
      } else {
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
          hideControlsTimeoutRef.current = null;
        }
        setShowControls(false);
      }
    },
    [resetHideControlsTimer, setShowControls]
  );

  useEffect(() => {
    const perfStart = performance.now();
    logger.info(`[PERF] PlayScreen useEffect START - source: ${source}, id: ${id}, title: ${title}`);

    setVideoRef(videoRef);
    if (source && id && title) {
      logger.info(`[PERF] Calling loadVideo with episodeIndex: ${episodeIndex}, position: ${position}`);
      loadVideo({ source, id, episodeIndex, position, title });
    } else {
      logger.info(`[PERF] Missing required params - source: ${!!source}, id: ${!!id}, title: ${!!title}`);
    }

    const perfEnd = performance.now();
    logger.info(`[PERF] PlayScreen useEffect END - took ${(perfEnd - perfStart).toFixed(2)}ms`);

    return () => {
      logger.info(`[PERF] PlayScreen unmounting - calling reset()`);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      reset(); // Reset state when component unmounts
    };
  }, [episodeIndex, source, position, setVideoRef, reset, loadVideo, id, title]);

  // Auto-show controls when video is paused, auto-hide after 3 seconds
  useEffect(() => {
    if (status && status.isLoaded && !status.isPlaying) {
      // Video is paused, show controls
      setShowControls(true);
      resetHideControlsTimer();
    } else {
      // Video is playing, clear the timer
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
    }
  }, [resetHideControlsTimer, setShowControls, status]);

  // Reset timer when showControls changes (user interaction)
  useEffect(() => {
    if (status && status.isLoaded && showControls && !status.isPlaying) {
      resetHideControlsTimer();
    }
  }, [resetHideControlsTimer, showControls, status]);

  useEffect(() => {
    if (!isBaselineMobile) return;
    if (!isPortrait) {
      setMobileFullscreenMode(true);
    }
  }, [isBaselineMobile, isPortrait]);

  // 屏幕点击处理 - TV设备单击播放/暂停，非TV设备单击切换控制条
  const onScreenPress = useCallback(() => {
    // 对于真实 TV 设备，保持单击播放/暂停
    if (deviceType === "tv") {
      usePlayerStore.getState().togglePlayPause();
      return;
    }
    if (controlsLocked) {
      return;
    }
    const currentShowControls = usePlayerStore.getState().showControls;
    handleToggleControlsVisibility(!currentShowControls);
  }, [controlsLocked, deviceType, handleToggleControlsVisibility]);

  const handleOverlayInteraction = useCallback(() => {
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  const handleRequestExit = useCallback(async () => {
    if (isBaselineMobile) {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        try {
          setControlsLocked(false);
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          await ScreenOrientation.unlockAsync();
        } catch (error) {
          logger.warn(`[UI] Failed to exit mobile fullscreen`, error);
        }
      }
      handleToggleControlsVisibility(false);
      setMobileFullscreenMode(false);
      return;
    }
    router.back();
  }, [handleToggleControlsVisibility, isBaselineMobile, router, setControlsLocked]);

  const handleRequestFlip = useCallback(async () => {
    if (!isBaselineMobile) {
      return;
    }
    if (Platform.OS !== "android" && Platform.OS !== "ios") {
      return;
    }
    try {
      const nextOrientation = isPortrait
        ? ScreenOrientation.OrientationLock.LANDSCAPE
        : ScreenOrientation.OrientationLock.PORTRAIT_UP;
      await ScreenOrientation.lockAsync(nextOrientation);
      setMobileFullscreenMode(true);
    } catch (error) {
      logger.warn(`[UI] Failed to flip orientation`, error);
    }
  }, [isBaselineMobile, isPortrait]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        videoRef.current?.pauseAsync();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (showControls) {
        setShowControls(false);
        return true;
      }
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => backHandler.remove();
  }, [showControls, setShowControls, router]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isLoading) {
      timeoutId = setTimeout(() => {
        if (usePlayerStore.getState().isLoading) {
          usePlayerStore.setState({ isLoading: false });
          Toast.show({ type: "error", text1: "播放超时，请重试" });
        }
      }, 60000); // 1 minute
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    if (!isBaselineMobile) {
      return;
    }

    return () => {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        ScreenOrientation.unlockAsync().catch((error) => {
          logger.warn(`[UI] Failed to unlock orientation on cleanup`, error);
        });
      }
    };
  }, [isBaselineMobile]);

  if (!detail) {
    return <VideoLoadingAnimation showProgressBar />;
  }

  const fullscreenControlsDeviceType = (isBaselineMobile ? "mobile" : "tablet") as "mobile" | "tablet";
  const overlayIsFullscreen = fullscreenControlsDeviceType !== "mobile" ? true : (!isPortrait || mobileFullscreenMode);

  if (deviceType === "mobile" && isPortrait && !mobileFullscreenMode) {
    return (
      <ThemedView focusable style={dynamicStyles.container}>
        <MobilePortraitPlayer
          videoRef={videoRef}
          videoProps={videoProps}
          isVideoReady={!!currentEpisode?.url}
          isLoading={isLoading}
          showControls={showControls}
          controlsLocked={controlsLocked}
          onToggleControls={handleToggleControlsVisibility}
          onInteract={handleOverlayInteraction}
          onToggleFullscreen={handleToggleFullscreen}
        />
        <EpisodeSelectionModal />
        <SourceSelectionModal />
        <SpeedSelectionModal />
      </ThemedView>
    );
  }

  return (
    <ThemedView focusable style={dynamicStyles.container}>
      <TouchableOpacity activeOpacity={1} style={dynamicStyles.videoContainer} onPress={onScreenPress}>
        {/* 条件渲染Video组件：只有在有有效URL时才渲染 */}
        {currentEpisode?.url ? (
          <Video ref={videoRef} style={dynamicStyles.videoPlayer} {...videoProps} />
        ) : (
          <LoadingContainer style={dynamicStyles.loadingContainer} currentEpisode={currentEpisode} />
        )}

        {deviceType === "tv" ? (
          <TvOverlay showControls={showControls} setShowControls={setShowControls} />
        ) : (
          <MobileTabletFullscreenControls
            deviceType={fullscreenControlsDeviceType}
            isPortrait={isPortrait}
            showControls={showControls}
            controlsLocked={controlsLocked}
            onUnlockControls={() => setControlsLocked(false)}
            onLockControls={() => setControlsLocked(true)}
            onToggleControls={handleToggleControlsVisibility}
            onInteract={handleOverlayInteraction}
            onRequestExit={handleRequestExit}
            onRequestFlip={isBaselineMobile ? handleRequestFlip : undefined}
            isFullscreen={overlayIsFullscreen}
          />
        )}

        {/* 只在Video组件存在且正在加载时显示加载动画覆盖层 */}
        {currentEpisode?.url && isLoading && (
          <View style={dynamicStyles.loadingContainer}>
            <VideoLoadingAnimation showProgressBar />
          </View>
        )}

        {/* <NextEpisodeOverlay visible={showNextEpisodeOverlay} onCancel={() => setShowNextEpisodeOverlay(false)} /> */}
      </TouchableOpacity>

      <EpisodeSelectionModal />
      <SourceSelectionModal />
      <SpeedSelectionModal />
    </ThemedView>
  );
}
