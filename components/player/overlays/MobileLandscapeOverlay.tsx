import React from "react";
import { StyleSheet, View } from "react-native";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react-native";
import OverlayLayout from "@/components/player/overlays/OverlayLayout";
import { baseOverlayStyles } from "@/components/player/overlays/shared/baseStyles";
import TopBar from "@/components/player/overlays/shared/TopBar";
import ProgressSection from "@/components/player/overlays/shared/ProgressSection";
import BottomControls from "@/components/player/overlays/shared/BottomControls";
import SideActionRail from "@/components/player/overlays/shared/SideActionRail";
import { IconButton } from "@/components/player/overlays/shared/IconButton";
import type { OverlayComponentProps } from "@/components/player/overlays/types";

/**
 * 场景：手机横屏全屏模式。
 * 使用 OverlayLayout 结合黑边测量，统一控制顶部、中心和底部的定位。
 */
const MobileLandscapeOverlay: React.FC<OverlayComponentProps> = ({
  context,
  titleMetadata,
  playbackState,
  progress,
  systemStatus,
  controls,
}) => {
  const topBar = (
    <TopBar
      context={context}
      title={titleMetadata}
      systemStatus={systemStatus}
      playbackState={playbackState}
      controls={controls}
      style={[baseOverlayStyles.topRow, styles.topRow]}
    />
  );

  const centerControls = (
    <View
      style={[
        baseOverlayStyles.centerControls,
        baseOverlayStyles.centerControlsLandscape,
        styles.centerControls,
      ]}
    >
      <IconButton
        icon={SkipBack}
        onPress={controls.onPlayPrevious}
        disabled={!playbackState.hasPreviousEpisode}
        size={48}
      />
      <IconButton
        icon={playbackState.isPlaying ? Pause : Play}
        onPress={controls.onTogglePlay}
        size={64}
      />
      <IconButton
        icon={SkipForward}
        onPress={controls.onPlayNext}
        disabled={!playbackState.hasNextEpisode}
        size={48}
      />
    </View>
  );

  const progressSection = (
    <ProgressSection
      context={context}
      progress={progress}
      style={[baseOverlayStyles.progressSection, styles.progressSection]}
    />
  );

  const bottomControls = (
    <BottomControls
      context={context}
      playbackState={playbackState}
      controls={controls}
      style={styles.bottomButtons}
    />
  );

  const sideRail = context.showSideActions ? <SideActionRail context={context} controls={controls} /> : undefined;

  return (
    <OverlayLayout
      context={context}
      isFullscreen
      topBar={topBar}
      centerControls={centerControls}
      progressSection={progressSection}
      bottomControls={bottomControls}
      sideRail={sideRail}
    />
  );
};

const styles = StyleSheet.create({
  topRow: {
    paddingHorizontal: 32,
  },
  centerControls: {
    // 背景透明，尺寸随按钮自适配
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignSelf: "center",
  },
  progressSection: {
    paddingHorizontal: 40,
    alignSelf: "center",
  },
  bottomButtons: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    alignSelf: "center",
  },
});

export default MobileLandscapeOverlay;
