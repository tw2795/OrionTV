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
 * 场景：平板横屏播放界面。
 * 借助 OverlayLayout 提供的测量结果，针对大屏留白与分栏进行精细控制。
 */
const TabletLandscapeOverlay: React.FC<OverlayComponentProps> = ({
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
        size={52}
      />
      <IconButton
        icon={playbackState.isPlaying ? Pause : Play}
        onPress={controls.onTogglePlay}
        size={68}
      />
      <IconButton
        icon={SkipForward}
        onPress={controls.onPlayNext}
        disabled={!playbackState.hasNextEpisode}
        size={52}
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
    paddingHorizontal: 48,
  },
  centerControls: {
    // 播放栏背景透明，尺寸随按钮个数自适配
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignSelf: "center",
  },
  progressSection: {
    paddingHorizontal: 60,
    // 让父级 OverlayLayout 的左右约束决定宽度，避免被限定为半屏
    alignSelf: "auto",
  },
  bottomButtons: {
    paddingHorizontal: 44,
    paddingBottom: 18,
    alignSelf: "auto",
  },
});

export default TabletLandscapeOverlay;
