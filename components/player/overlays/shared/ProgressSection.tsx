import React from "react";
import { GestureResponderEvent, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { Maximize2 } from "lucide-react-native";
import type { OverlayCommonContext, ProgressSectionPayload } from "@/components/player/overlays/types";
import { baseOverlayStyles } from "@/components/player/overlays/shared/baseStyles";
import { IconButton } from "@/components/player/overlays/shared/IconButton";
import { DEFAULT_KNOB_SIZE } from "@/components/player/overlays/shared/systemStatus";

export interface ProgressSectionProps {
  context: OverlayCommonContext;
  progress: ProgressSectionPayload;
  style?: StyleProp<ViewStyle>;
  timeLabelStyle?: StyleProp<TextStyle>;
}

const ProgressSection: React.FC<ProgressSectionProps> = ({ context, progress, style, timeLabelStyle }) => {
  const knobSize = progress.knobSize ?? DEFAULT_KNOB_SIZE;
  const isPortrait = context.layout === "portrait";

  const handlePress = (event: GestureResponderEvent) => {
    if (typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
    progress.onProgressPress(event.nativeEvent.locationX);
  };

  return (
    <View style={[baseOverlayStyles.progressSection, style]}>
      <Text
        style={[
          baseOverlayStyles.timeLabel,
          isPortrait && baseOverlayStyles.timeLabelCompact,
          timeLabelStyle,
        ]}
      >
        {progress.currentTimeLabel}
      </Text>
      <Pressable
        style={baseOverlayStyles.progressBarContainer}
        onLayout={progress.onProgressLayout}
        onPress={handlePress}
        {...progress.panHandlers}
      >
        <View style={baseOverlayStyles.progressBackground} />
        <View style={[baseOverlayStyles.progressBuffered, { width: `${progress.bufferedProgress * 100}%` }]} />
        <View style={[baseOverlayStyles.progressFill, { width: `${progress.currentProgress * 100}%` }]} />
        <View
          style={[
            styles.progressKnob,
            {
              width: knobSize,
              height: knobSize,
              borderRadius: knobSize / 2,
              marginTop: -knobSize / 2,
              left: Math.max(-knobSize / 2, progress.progressWidth * progress.currentProgress - knobSize / 2),
            },
          ]}
        />
      </Pressable>
      <Text
        style={[
          baseOverlayStyles.timeLabel,
          isPortrait && baseOverlayStyles.timeLabelCompact,
          timeLabelStyle,
        ]}
      >
        {progress.durationLabel}
      </Text>
      {progress.showFullscreenToggle && progress.onToggleFullscreen ? (
        <IconButton icon={Maximize2} onPress={progress.onToggleFullscreen} size={20} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  progressKnob: {
    position: "absolute",
    top: "50%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
});

export default ProgressSection;
