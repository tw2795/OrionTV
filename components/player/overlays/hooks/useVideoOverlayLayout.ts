import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent, LayoutRectangle, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { OverlayLayout, OverlayVariant } from "@/components/player/overlays/layoutConfig";

const DEFAULT_ASPECT_RATIO = 16 / 9;

type SectionKey =
  | "topBar"
  | "centerControls"
  | "bottomControls"
  | "progress"
  | "bottomButtons"
  | "sideRail";

type SectionHeights = Record<SectionKey, number>;

interface VideoOverlayMeasurements {
  videoRect: LayoutRectangle | null;
  contentBounds: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  } | null;
  blackBars: {
    vertical: number;
    horizontal: number;
  };
  sectionHeights: SectionHeights;
}

interface VideoOverlayStyles {
  container: ViewStyle;
  topBar: ViewStyle;
  centerControls: ViewStyle;
  bottomControls: ViewStyle;
  progress: ViewStyle;
  bottomButtons: ViewStyle;
  sideRail: ViewStyle;
}

interface OverlaySpacing {
  topPadding: number;
  bottomPadding: number;
  stackGap: number;
}

interface VideoOverlayLayoutResult {
  measurements: VideoOverlayMeasurements;
  styles: VideoOverlayStyles;
  handleContainerLayout: (event: LayoutChangeEvent) => void;
  getSectionLayoutHandler: (section: SectionKey) => (event: LayoutChangeEvent) => void;
}

interface UseVideoOverlayLayoutOptions {
  layout: OverlayLayout;
  variant: OverlayVariant;
  deviceType: "mobile" | "tablet";
  isFullscreen?: boolean;
  aspectRatio?: number;
}

const createDefaultSectionHeights = (): SectionHeights => ({
  topBar: 0,
  centerControls: 0,
  bottomControls: 0,
  progress: 0,
  bottomButtons: 0,
  sideRail: 0,
});

const clampNumber = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const pickValidTop = (value: number, fallback: number): number => {
  if (Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

interface SpacingParams {
  layout: OverlayLayout;
  variant: OverlayVariant;
  deviceType: "mobile" | "tablet";
  isFullscreen: boolean;
}

const getOverlaySpacing = ({ layout, variant, deviceType, isFullscreen }: SpacingParams): OverlaySpacing => {
  if (layout === "portrait") {
    if (variant === "mobilePortraitFullscreen" || isFullscreen) {
      return {
        topPadding: 18,
        bottomPadding: 20,
        stackGap: 14,
      };
    }
    return {
      topPadding: 14,
      bottomPadding: 16,
      stackGap: 12,
    };
  }

  if (layout === "landscape") {
    if (variant === "mobileLandscape" && deviceType === "mobile") {
      return {
        topPadding: 20,
        bottomPadding: 16,
        stackGap: 14,
      };
    }

    if (deviceType === "tablet") {
      return {
        topPadding: 24,
        bottomPadding: 20,
        stackGap: 16,
      };
    }

    return {
      topPadding: 22,
      bottomPadding: 18,
      stackGap: 14,
    };
  }

  return {
    topPadding: 18,
    bottomPadding: 18,
    stackGap: 14,
  };
};

const horizontalInsetBias = (layout: OverlayLayout, deviceType: "mobile" | "tablet", variant: OverlayVariant): number => {
  if (layout === "landscape" && deviceType === "mobile") {
    if (variant === "mobileLandscape") {
      return 12;
    }
  }
  if (layout === "portrait" && deviceType === "mobile") {
    if (variant === "mobilePortraitFullscreen") {
      return 6;
    }
  }
  return 0;
};

export const useVideoOverlayLayout = ({
  layout,
  variant,
  deviceType,
  isFullscreen = false,
  aspectRatio = DEFAULT_ASPECT_RATIO,
}: UseVideoOverlayLayoutOptions): VideoOverlayLayoutResult => {
  const insets = useSafeAreaInsets();
  const [videoRect, setVideoRect] = useState<LayoutRectangle | null>(null);
  const [sectionHeights, setSectionHeights] = useState<SectionHeights>(() => createDefaultSectionHeights());

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextRect = event.nativeEvent.layout;
    setVideoRect((current) => {
      if (
        current &&
        current.x === nextRect.x &&
        current.y === nextRect.y &&
        current.width === nextRect.width &&
        current.height === nextRect.height
      ) {
        return current;
      }
      return nextRect;
    });
  }, []);

  const getSectionLayoutHandler = useCallback(
    (section: SectionKey) => (event: LayoutChangeEvent) => {
      const nextHeight = event.nativeEvent.layout.height;
      setSectionHeights((prev) => {
        const currentHeight = prev[section];
        if (Math.abs(currentHeight - nextHeight) < 0.5) {
          return prev;
        }
        return {
          ...prev,
          [section]: nextHeight,
        };
      });
    },
    []
  );

  const measurements = useMemo<VideoOverlayMeasurements>(() => {
    if (!videoRect) {
      return {
        videoRect: null,
        contentBounds: null,
        blackBars: { vertical: 0, horizontal: 0 },
        sectionHeights,
      };
    }

    const { width, height, x, y } = videoRect;

    const verticalContentHeight = width / aspectRatio;
    const horizontalContentWidth = height * aspectRatio;

    const rawVerticalBlack = clampNumber((height - verticalContentHeight) / 2, 0, height / 2);
    const rawHorizontalBlack = clampNumber((width - horizontalContentWidth) / 2, 0, width / 2);

    const verticalBlack = Number.isFinite(rawVerticalBlack) ? rawVerticalBlack : 0;
    const horizontalBlack = Number.isFinite(rawHorizontalBlack) ? rawHorizontalBlack : 0;

    const contentTop = y + verticalBlack;
    const contentBottom = y + height - verticalBlack;
    const contentLeft = x + horizontalBlack;
    const contentRight = x + width - horizontalBlack;

    return {
      videoRect,
      contentBounds: {
        top: contentTop,
        bottom: contentBottom,
        left: contentLeft,
        right: contentRight,
        width: contentRight - contentLeft,
        height: contentBottom - contentTop,
      },
      blackBars: {
        vertical: verticalBlack,
        horizontal: horizontalBlack,
      },
      sectionHeights,
    };
  }, [aspectRatio, sectionHeights, videoRect]);

  const spacing = useMemo<OverlaySpacing>(
    () => getOverlaySpacing({ layout, variant, deviceType, isFullscreen }),
    [deviceType, isFullscreen, layout, variant]
  );

  const styles = useMemo<VideoOverlayStyles>(() => {
    const baseContainer: ViewStyle = videoRect
      ? {
          position: "absolute",
          top: videoRect.y,
          left: videoRect.x,
          width: videoRect.width,
          height: videoRect.height,
        }
      : {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        };

    if (!videoRect) {
      return {
        container: baseContainer,
        topBar: {},
        centerControls: {},
        bottomControls: {},
        progress: {},
        bottomButtons: {},
        sideRail: {},
      };
    }

    const { height, width, y } = videoRect;
    const { blackBars, contentBounds } = measurements;

    const insetTop = isFullscreen ? insets.top : 0;
    const insetBottom = isFullscreen ? insets.bottom : 0;
    const insetLeft = isFullscreen ? insets.left : 0;
    const insetRight = isFullscreen ? insets.right : 0;

    // 以视频容器为唯一坐标系：先定位中心、黑边，再叠加安全区，从而同时适配全屏、带刘海及普通模式。
    const centerOfVideo = y + height / 2;
    const verticalBlack = blackBars.vertical;
    const containerTop = y + insetTop;
    const containerBottom = y + height - insetBottom;
    const contentTopEdge = contentBounds ? contentBounds.top : y;
    const contentBottomEdge = contentBounds ? contentBounds.bottom : y + height;

    const safeTopAnchor = Math.max(containerTop, contentTopEdge + spacing.topPadding);
    const safeBottomAnchor = Math.min(containerBottom, contentBottomEdge - spacing.bottomPadding);

    const clampSectionTop = (value: number, sectionHeight: number): number => {
      if (!Number.isFinite(value)) {
        return safeTopAnchor;
      }
      const minTop = containerTop;
      const maxTop = containerBottom - Math.max(sectionHeight, 0);
      return clampNumber(value, minTop, Math.max(minTop, maxTop));
    };

    const topBarHeight = sectionHeights.topBar;
    const centerHeight = sectionHeights.centerControls;
    const bottomControlsHeight = sectionHeights.bottomControls;
    const progressHeight = sectionHeights.progress;
    const bottomButtonsHeight = sectionHeights.bottomButtons;
    const sideRailHeight = sectionHeights.sideRail;

    const portraitTopBase = y + verticalBlack / 2;

    const hasTopBar = topBarHeight > 0.1;
    const hasBottomButtons = bottomButtonsHeight > 0.1;
    const hasBottomControls = bottomControlsHeight > 0.1;
    const hasProgress = progressHeight > 0.1;

    // 顶部标题栏定位：
    // - 移动端竖屏（非全屏）与横屏：始终贴合安全区顶部，避免出现“向下溢出”
    // - 其它场景：如果存在明显黑边则尽量居中于上方黑边，否则贴安全区
    const forceSafeTopForTopBar =
      (deviceType === "mobile" && layout === "portrait" && !isFullscreen) ||
      (deviceType === "mobile" && layout === "landscape");

    const computedTopBarTop = forceSafeTopForTopBar
      // 强制贴合容器顶部（0 或极小偏移），避免向下溢出
      ? containerTop
      : verticalBlack > spacing.topPadding * 1.5
        ? portraitTopBase - topBarHeight / 2 + insetTop
        : safeTopAnchor;

    const topBarTop = hasTopBar
      ? clampSectionTop(computedTopBarTop, topBarHeight)
      : safeTopAnchor;

    const centerControlsTop = clampSectionTop(centerOfVideo - centerHeight / 2, centerHeight);

    let bottomButtonsTop = hasBottomButtons
      ? clampSectionTop(safeBottomAnchor - bottomButtonsHeight, bottomButtonsHeight)
      : safeBottomAnchor;

    // 手机竖屏全屏：底部按钮需要显示在“底部 padding”区域内
    if (hasBottomButtons && deviceType === "mobile" && layout === "portrait" && variant === "mobilePortraitFullscreen") {
      bottomButtonsTop = clampSectionTop(containerBottom - spacing.bottomPadding - bottomButtonsHeight, bottomButtonsHeight);
    }

    const bottomControlsAnchor = hasBottomButtons
      ? bottomButtonsTop - spacing.stackGap
      : safeBottomAnchor;

    let bottomControlsTop = hasBottomControls
      ? clampSectionTop(bottomControlsAnchor - bottomControlsHeight, bottomControlsHeight)
      : bottomControlsAnchor;

    // 手机竖屏全屏：底部控制栏应显示在下方 padding 内
    if (hasBottomControls && deviceType === "mobile" && layout === "portrait" && variant === "mobilePortraitFullscreen") {
      bottomControlsTop = clampSectionTop(containerBottom - spacing.bottomPadding - bottomControlsHeight, bottomControlsHeight);
    }

    const lowestOccupiedTop = hasBottomControls
      ? bottomControlsTop
      : hasBottomButtons
        ? bottomButtonsTop
        : safeBottomAnchor;

    const progressAnchor =
      hasBottomControls || hasBottomButtons
        ? lowestOccupiedTop - spacing.stackGap
        : safeBottomAnchor;

    // 进度条定位：移动端竖屏全屏时，按照需求仅在底部安全区上方，并上移进度条高度的 1/4。
    let progressTop = hasProgress
      ? clampSectionTop(progressAnchor - progressHeight, progressHeight)
      : progressAnchor;

    if (
      hasProgress &&
      deviceType === "mobile" &&
      layout === "portrait" &&
      variant === "mobilePortraitFullscreen"
    ) {
      const quarter = progressHeight * 0.25;
      // 进度条相对底部 padding 上移 1/4 高度
      progressTop = clampSectionTop(progressTop + quarter, progressHeight);
    }

    const sideRailTop = clampSectionTop(centerOfVideo - sideRailHeight / 2, sideRailHeight);

    const baseHorizontalInsets = layout === "landscape" ? Math.max(insetLeft, insetRight) : 0;
    let sideRailRight = Math.max(20, 20 + insetRight);

    const topBarStyle: ViewStyle = {
      position: "absolute",
      left: Math.max(0, insetLeft - horizontalInsetBias(layout, deviceType, variant)),
      right: Math.max(0, insetRight - horizontalInsetBias(layout, deviceType, variant)),
      top: topBarTop,
    };

    const centerStyle: ViewStyle = {
      position: "absolute",
      left: baseHorizontalInsets,
      right: baseHorizontalInsets,
      top: centerControlsTop,
    };

    const bottomControlsStyle: ViewStyle = {
      position: "absolute",
      left: baseHorizontalInsets,
      right: baseHorizontalInsets,
      top: bottomControlsTop,
    };

    const progressStyle: ViewStyle = {
      position: "absolute",
      left: baseHorizontalInsets,
      right: baseHorizontalInsets,
      top: progressTop,
    };

    const bottomButtonsStyle: ViewStyle = {
      position: "absolute",
      left: baseHorizontalInsets,
      right: baseHorizontalInsets,
      top: hasBottomButtons ? bottomButtonsTop : safeBottomAnchor,
    };

    const sideRailStyle: ViewStyle = {
      position: "absolute",
      right: sideRailRight,
      top: sideRailTop,
      left: layout === "landscape" && deviceType === "tablet" ? undefined : undefined,
    };

    // 横向场景需要重新分配左右留白，使控件对齐视频内容边界而非全屏宽度。
    if (layout === "landscape") {
      const horizontalBlack = measurements.blackBars.horizontal;
      const contentLeft = contentBounds ? contentBounds.left : 0;
      const contentRight = contentBounds ? contentBounds.right : width;

      topBarStyle.left = pickValidTop(
        contentLeft - insetLeft,
        insetLeft
      );
      topBarStyle.right = Math.max(0, videoRect.width - contentRight - insetRight);

      bottomControlsStyle.left = topBarStyle.left;
      bottomControlsStyle.right = topBarStyle.right;

      progressStyle.left = contentLeft + insetLeft * 0.5;
      progressStyle.right = videoRect.width - contentRight + insetRight * 0.5;

      if (deviceType === "tablet") {
        centerStyle.left = contentLeft + Math.max(0, horizontalBlack / 2);
        centerStyle.right = videoRect.width - contentRight + Math.max(0, horizontalBlack / 2);
      }

      if (variant === "mobileLandscape") {
        sideRailStyle.right = Math.max(20, horizontalBlack + 20 + insetRight);
      }
    }

    // 竖屏全屏：右侧栏需要更贴近右侧，避免与进度条交叉
    if (variant === "mobilePortraitFullscreen") {
      // 右移贴边（避免与进度条交叉），保留安全区
      sideRailStyle.right = Math.max(12 + insetRight, 12);
    }

    return {
      container: baseContainer,
      topBar: topBarStyle,
      centerControls: centerStyle,
      bottomControls: bottomControlsStyle,
      progress: progressStyle,
      bottomButtons: bottomButtonsStyle,
      sideRail: sideRailStyle,
    };
  }, [
    deviceType,
    insets.bottom,
    insets.left,
    insets.right,
    insets.top,
    isFullscreen,
    layout,
    measurements,
    sectionHeights.bottomButtons,
    sectionHeights.bottomControls,
    sectionHeights.centerControls,
    sectionHeights.progress,
    sectionHeights.sideRail,
    sectionHeights.topBar,
    spacing.bottomPadding,
    spacing.stackGap,
    spacing.topPadding,
    variant,
    videoRect,
  ]);

  return {
    measurements,
    styles,
    handleContainerLayout,
    getSectionLayoutHandler,
  };
};

export type { VideoOverlayLayoutResult, VideoOverlayMeasurements, VideoOverlayStyles, SectionKey };
