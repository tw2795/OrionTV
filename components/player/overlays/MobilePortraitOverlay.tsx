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
 * 场景：手机竖屏（非全屏）观看。
 * 采用 OverlayLayout 基于视频容器的坐标结果定位各功能区。
 */
const MobilePortraitOverlay: React.FC<OverlayComponentProps> = ({
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
        baseOverlayStyles.centerControlsPortrait,
        styles.centerControls,
      ]}
    >
      <IconButton
        icon={SkipBack}
        onPress={controls.onPlayPrevious}
        disabled={!playbackState.hasPreviousEpisode}
        size={40}
      />
      <IconButton
        icon={playbackState.isPlaying ? Pause : Play}
        onPress={controls.onTogglePlay}
        size={56}
      />
      <IconButton
        icon={SkipForward}
        onPress={controls.onPlayNext}
        disabled={!playbackState.hasNextEpisode}
        size={40}
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

  const bottomButtons = context.showBottomButtons ? (
    <BottomControls
      context={context}
      playbackState={playbackState}
      controls={controls}
      style={[styles.bottomButtons]}
    />
  ) : undefined;

  const sideRail = context.showSideActions ? <SideActionRail context={context} controls={controls} /> : undefined;

  return (
    <OverlayLayout
      context={context}
      topBar={topBar}
      centerControls={centerControls}
      progressSection={progressSection}
      bottomControls={bottomButtons}
      sideRail={sideRail}
    />
  );
};

const styles = StyleSheet.create({
  topRow: {
    paddingHorizontal: 24,
  },
  centerControls: {
    // 背景透明，尺寸随按钮自适配
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  progressSection: {
    paddingHorizontal: 24,
  },
  bottomButtons: {
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
});

export default MobilePortraitOverlay;
