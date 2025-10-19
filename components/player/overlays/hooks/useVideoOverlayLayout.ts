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
    const contentBottom = contentBounds ? contentBounds.bottom : y + height;
    const contentTop = contentBounds ? contentBounds.top : y;

    const topBarHeight = sectionHeights.topBar;
    const centerHeight = sectionHeights.centerControls;
    const bottomControlsHeight = sectionHeights.bottomControls;
    const progressHeight = sectionHeights.progress;
    const bottomButtonsHeight = sectionHeights.bottomButtons;
    const sideRailHeight = sectionHeights.sideRail;

    // portraitTopBase / portraitBottomBase 分别对应上下黑边中心，作为顶部与底部元素的参考线。
    const portraitTopBase = y + verticalBlack / 2;
    const portraitBottomBase = y + height - verticalBlack / 2;

    const topBarTop = pickValidTop(
      portraitTopBase - topBarHeight / 2 + insetTop,
      y + insetTop
    );

    const centerControlsTop = pickValidTop(
      centerOfVideo - centerHeight / 2,
      centerOfVideo
    );

    const bottomControlsTop = pickValidTop(
      portraitBottomBase - bottomControlsHeight / 2 - insetBottom,
      contentBottom - bottomControlsHeight - insetBottom
    );

    const progressTop = pickValidTop(
      contentBottom - progressHeight + progressHeight * 0.25 - insetBottom * 0.5,
      contentBottom - progressHeight - insetBottom
    );

    const bottomButtonsTop = pickValidTop(
      portraitBottomBase - bottomButtonsHeight - insetBottom - progressHeight - 12,
      contentBottom - bottomButtonsHeight - insetBottom
    );

    const sideRailTop = pickValidTop(
      centerOfVideo - sideRailHeight / 2,
      centerOfVideo
    );

    const baseHorizontalInsets = layout === "landscape" ? Math.max(insetLeft, insetRight) : 0;
    const sideRailRight = Math.max(20, 20 + insetRight);

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
      top: bottomButtonsTop,
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

    return {
      container: baseContainer,
      topBar: topBarStyle,
      centerControls: centerStyle,
      bottomControls: bottomControlsStyle,
      progress: progressStyle,
      bottomButtons: bottomButtonsStyle,
      sideRail: sideRailStyle,
    };
  }, [deviceType, insets.bottom, insets.left, insets.right, insets.top, isFullscreen, layout, measurements, sectionHeights.bottomButtons,
    sectionHeights.bottomControls, sectionHeights.centerControls, sectionHeights.progress, sectionHeights.sideRail, sectionHeights.topBar,
    variant, videoRect]);

  return {
    measurements,
    styles,
    handleContainerLayout,
    getSectionLayoutHandler,
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

export type { VideoOverlayLayoutResult, VideoOverlayMeasurements, VideoOverlayStyles, SectionKey };
