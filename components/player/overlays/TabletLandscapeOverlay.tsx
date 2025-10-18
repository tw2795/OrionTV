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
 * 场景：平板横屏播放界面。
 * 特点：内容留白更充足、底部按钮与进度条垂直间距增大、侧边操作常驻。
 */
const TabletLandscapeOverlay: React.FC<OverlayComponentProps> = ({
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
    paddingTop: 20,
    paddingBottom: 12,
  },
  centerControls: {
    marginTop: 12,
  },
  bottomSection: {
    paddingBottom: 24,
    gap: 16,
  },
  progressSection: {
    marginBottom: 12,
  },
  bottomButtons: {
    paddingBottom: 8,
  },
});

export default TabletLandscapeOverlay;
