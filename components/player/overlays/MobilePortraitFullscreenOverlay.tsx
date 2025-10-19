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
 * 场景：手机竖屏全屏模式。
 * 通过 OverlayLayout 结合测量结果，保证控件在黑边内精准定位并兼顾安全区。
 */
const MobilePortraitFullscreenOverlay: React.FC<OverlayComponentProps> = ({
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
        size={44}
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
        size={44}
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
    paddingHorizontal: 28,
    marginTop: 0,
  },
  centerControls: {
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  progressSection: {
    paddingHorizontal: 28,
    marginBottom: 12,
  },
  bottomButtons: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
});

export default MobilePortraitFullscreenOverlay;
