import React from "react";
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { baseOverlayStyles } from "@/components/player/overlays/shared/baseStyles";
import type {
  OverlayCommonContext,
  PlaybackControlHandlers,
  PlaybackStateSnapshot,
} from "@/components/player/overlays/types";

export interface BottomControlsProps {
  context: OverlayCommonContext;
  playbackState: PlaybackStateSnapshot;
  controls: PlaybackControlHandlers;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const BottomControls: React.FC<BottomControlsProps> = ({ context, playbackState, controls, style, textStyle }) => {
  if (!context.showBottomButtons) {
    return null;
  }

  return (
    <View style={[baseOverlayStyles.bottomButtonsRow, style]}>
      <Pressable style={baseOverlayStyles.bottomButton} onPress={controls.onIntroToggle}>
        <Text
          style={[
            baseOverlayStyles.bottomButtonText,
            playbackState.introMarked && baseOverlayStyles.bottomButtonTextActive,
            textStyle,
          ]}
        >
          片头
        </Text>
      </Pressable>
      <Pressable style={baseOverlayStyles.bottomButton} onPress={controls.onOutroToggle}>
        <Text
          style={[
            baseOverlayStyles.bottomButtonText,
            playbackState.outroMarked && baseOverlayStyles.bottomButtonTextActive,
            textStyle,
          ]}
        >
          片尾
        </Text>
      </Pressable>
      <Pressable style={baseOverlayStyles.bottomButton} onPress={controls.onShowEpisodeModal}>
        <Text style={[baseOverlayStyles.bottomButtonText, textStyle]}>选集</Text>
      </Pressable>
      <Pressable style={baseOverlayStyles.bottomButton} onPress={controls.onShowSourceModal}>
        <Text style={[baseOverlayStyles.bottomButtonText, textStyle]}>换源</Text>
      </Pressable>
    </View>
  );
};

export default BottomControls;
