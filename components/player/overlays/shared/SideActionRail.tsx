import React from "react";
import { CornerUpLeft, Lock, RotateCw } from "lucide-react-native";
import PlayerActionRail from "@/components/player/controls/PlayerActionRail";
import { IconButton } from "@/components/player/overlays/shared/IconButton";
import type { OverlayCommonContext, PlaybackControlHandlers } from "@/components/player/overlays/types";

export interface SideActionRailProps {
  context: OverlayCommonContext;
  controls: PlaybackControlHandlers;
}

const SideActionRail: React.FC<SideActionRailProps> = ({ context, controls }) => {
  if (!context.showSideActions) {
    return null;
  }

  const isPortrait = context.layout === "portrait";
  const shouldShowFlip = context.deviceType === "mobile" && typeof controls.onRequestFlip === "function";

  return (
    <PlayerActionRail isPortrait={isPortrait} alignCenter={context.alignSideRailCenter}>
      {typeof controls.onRequestExit === "function" ? (
        <IconButton icon={CornerUpLeft} onPress={controls.onRequestExit} size={26} />
      ) : null}
      <IconButton icon={Lock} onPress={controls.onLockControls} size={24} />
      {shouldShowFlip ? <IconButton icon={RotateCw} onPress={controls.onRequestFlip} size={24} /> : null}
    </PlayerActionRail>
  );
};

export default SideActionRail;
