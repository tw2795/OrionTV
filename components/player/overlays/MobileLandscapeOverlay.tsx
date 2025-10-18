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
 * 场景：手机横屏全屏模式。
 * 特点：中心控制靠前、侧边操作常驻、底部提供完整快捷按钮组。
 */
const MobileLandscapeOverlay: React.FC<OverlayComponentProps> = ({
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
          baseOverlayStyles.contentLandscape,
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
        />
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
            size={44}
          />
          <IconButton
            icon={playbackState.isPlaying ? Pause : Play}
            onPress={controls.onTogglePlay}
            size={60}
          />
          <IconButton
            icon={SkipForward}
            onPress={controls.onPlayNext}
            disabled={!playbackState.hasNextEpisode}
            size={44}
          />
        </View>
        <View
          style={[
            baseOverlayStyles.bottomSection,
            baseOverlayStyles.bottomSectionLandscape,
            styles.bottomSection,
          ]}
        >
          <ProgressSection context={context} progress={progress} style={styles.progressSection} />
          <BottomControls
            context={context}
            playbackState={playbackState}
            controls={controls}
            style={styles.bottomButtons}
          />
        </View>
      </View>
      <SideActionRail context={context} controls={controls} />
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: 6,
    paddingBottom: 16,
  },
  centerControls: {
    marginTop: 0,
    marginBottom: 0,
  },
  bottomSection: {
    marginTop: 8,
    paddingBottom: 10,
    gap: 14,
  },
  progressSection: {
    marginTop: 0,
    marginBottom: 10,
  },
  bottomButtons: {
    paddingBottom: 4,
  },
});

export default MobileLandscapeOverlay;
