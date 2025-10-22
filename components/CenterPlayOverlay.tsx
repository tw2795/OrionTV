import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, PressableProps } from "react-native";
import type { View as RNView } from "react-native";
import { Play, Pause } from "lucide-react-native";
import usePlayerStore from "@/stores/playerStore";
import { formatTime } from "@/utils/formatTime";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface CenterPlayOverlayProps {
  tvAutoFocus?: boolean;
  onTVFocus?: () => void;
  tvFocusProps?: Pick<
    PressableProps,
    "nextFocusDown" | "nextFocusUp" | "nextFocusLeft" | "nextFocusRight" | "hasTVPreferredFocus"
  >;
}

/**
 * TV 和移动端共享的居中播放按钮覆盖层。
 * 在 TV 模式下只提供缩小后的圆形点击区域，避免误触到底部控制栏。
 */
export const CenterPlayOverlay = React.forwardRef<RNView, CenterPlayOverlayProps>(
  ({ tvAutoFocus = false, onTVFocus, tvFocusProps }, ref) => {
    const { status, togglePlayPause, showControls } = usePlayerStore();
    const { deviceType } = useResponsiveLayout();
    const isTV = deviceType === "tv";

    const tvPlayButtonSize = useMemo(() => 80 * 1.5, []);

    if (!status?.isLoaded || !showControls) {
      return null;
    }

    const currentTime = formatTime(status.positionMillis);
    const totalTime = formatTime(status.durationMillis || 0);
    const isPaused = !status.isPlaying;

    const overlayPointerEvents = isTV ? "box-none" : isPaused ? "box-none" : "none";

    const focusableProps = {
      hasTVPreferredFocus: tvFocusProps?.hasTVPreferredFocus ?? tvAutoFocus,
      nextFocusDown: tvFocusProps?.nextFocusDown,
      nextFocusUp: tvFocusProps?.nextFocusUp,
      nextFocusLeft: tvFocusProps?.nextFocusLeft,
      nextFocusRight: tvFocusProps?.nextFocusRight,
    };

    return (
      <View
        style={[styles.overlay, isPaused ? styles.overlayActive : styles.overlayInactive]}
        pointerEvents={overlayPointerEvents}
      >
        {isTV ? (
          <Pressable
            ref={ref as any}
            focusable
            {...focusableProps}
            style={[
              styles.tvPlayButtonTouchable,
              { width: tvPlayButtonSize, height: tvPlayButtonSize, borderRadius: tvPlayButtonSize / 2 },
            ]}
            onPress={togglePlayPause}
            onFocus={onTVFocus}
          >
            <View style={styles.centerContent}>
              {status.isPlaying ? (
                <Pause color="white" size={80} />
              ) : (
                <Play color="white" size={80} fill="white" />
              )}
            </View>
          </Pressable>
        ) : (
          isPaused && (
            <Pressable style={styles.centerContent} onPress={togglePlayPause} pointerEvents="auto">
              <Play color="white" size={80} fill="white" />
            </Pressable>
          )
        )}

        {!isTV && (
          <View style={[styles.timeContainer, isPaused ? styles.timeWithOverlay : styles.timeFloating]}>
            <Text style={styles.timeText}>
              {currentTime} / {totalTime}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

CenterPlayOverlay.displayName = "CenterPlayOverlay";

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  overlayActive: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayInactive: {
    backgroundColor: "transparent",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  tvPlayButtonTouchable: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  timeContainer: {
    marginTop: 20,
  },
  timeText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  timeWithOverlay: {},
  timeFloating: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
