import React from "react";
import { CornerUpLeft, Lock } from "lucide-react-native";
import { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import PlayerActionRail from "@/components/player/controls/PlayerActionRail";
import { IconButton } from "@/components/player/overlays/shared/IconButton";
import type { OverlayCommonContext, PlaybackControlHandlers } from "@/components/player/overlays/types";

export interface SideActionRailProps {
  context: OverlayCommonContext;
  controls: PlaybackControlHandlers;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
}

const SideActionRail: React.FC<SideActionRailProps> = ({ context, controls, style, onLayout }) => {
  if (!context.showSideActions) {
    return null;
  }

  const isPortrait = context.layout === "portrait";
  const shouldShowFlip = context.deviceType === "mobile" && typeof controls.onRequestFlip === "function";

  return (
    <PlayerActionRail
      isPortrait={isPortrait}
      alignCenter={context.alignSideRailCenter}
      style={style}
      onLayout={onLayout}
    >
      {typeof controls.onRequestExit === "function" ? (
        <IconButton icon={CornerUpLeft} onPress={controls.onRequestExit} size={26} />
      ) : null}
      <IconButton icon={Lock} onPress={controls.onLockControls} size={24} />
      {shouldShowFlip ? <IconButton icon={ScreenRotationIcon} onPress={controls.onRequestFlip} size={24} /> : null}
    </PlayerActionRail>
  );
};

const ScreenRotationIcon: React.FC<{ color?: string; size?: number }> = ({ color = "#fff", size = 24 }) => (
  <MaterialCommunityIcons name="screen-rotation" color={color} size={size} />
);

export default SideActionRail;
