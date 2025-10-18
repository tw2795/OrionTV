import React from "react";
import { StyleSheet, View } from "react-native";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react-native";
import { baseOverlayStyles } from "@/components/player/overlays/shared/baseStyles";
import TopBar from "@/components/player/overlays/shared/TopBar";
import ProgressSection from "@/components/player/overlays/shared/ProgressSection";
import BottomControls from "@/components/player/overlays/shared/BottomControls";
import SideActionRail from "@/components/player/overlays/shared/SideActionRail";
import { IconButton } from "@/components/player/overlays/shared/IconButton";
import type { OverlayComponentProps } from "@/components/player/overlays/types";

/**
 * 场景：手机竖屏（非全屏）观看。
 * 特点：顶部空间紧凑、隐藏底部快捷按钮、不展示侧边操作栏。
 */
const MobilePortraitOverlay: React.FC<OverlayComponentProps> = ({
  context,
  titleMetadata,
  playbackState,
  progress,
  systemStatus,
  controls,
}) => {
  return (
    <>
      <View
        style={[
          baseOverlayStyles.content,
          baseOverlayStyles.contentPortrait,
          styles.content,
        ]}
        pointerEvents="auto"
      >
        <TopBar
          context={context}
          title={titleMetadata}
          systemStatus={systemStatus}
          playbackState={playbackState}
          controls={controls}
          style={styles.topRow}
        />
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
        <View
          style={[
            baseOverlayStyles.bottomSection,
            baseOverlayStyles.bottomSectionPortrait,
            styles.bottomSection,
          ]}
        >
          <ProgressSection context={context} progress={progress} style={styles.progressSection} />
          <BottomControls context={context} playbackState={playbackState} controls={controls} style={styles.bottomButtons} />
        </View>
      </View>
      <SideActionRail context={context} controls={controls} />
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: 6,
    paddingBottom: 12,
  },
  topRow: {
    marginTop: -6,
  },
  centerControls: {
    marginTop: 20,
  },
  bottomSection: {
    marginTop: 12,
    paddingBottom: 10,
  },
  progressSection: {
    marginBottom: 10,
  },
  bottomButtons: {
    paddingBottom: 0,
  },
});

export default MobilePortraitOverlay;
