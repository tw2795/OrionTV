import React from "react";
import CommonPlayerOverlay from "@/components/player/controls/CommonPlayerOverlay";

interface MobileTabletFullscreenControlsProps {
  deviceType: "mobile" | "tablet";
  isPortrait: boolean;
  showControls: boolean;
  controlsLocked: boolean;
  onUnlockControls: () => void;
  onLockControls: () => void;
  onToggleControls: (show: boolean) => void;
  onInteract: () => void;
  onRequestExit: () => void;
  onRequestFlip?: () => void;
  isFullscreen?: boolean;
}

const MobileTabletFullscreenControls: React.FC<MobileTabletFullscreenControlsProps> = ({
  deviceType,
  isPortrait,
  showControls,
  controlsLocked,
  onUnlockControls,
  onLockControls,
  onToggleControls,
  onInteract,
  onRequestExit,
  onRequestFlip,
  isFullscreen = true,
}) => {
  const layout = isPortrait ? "portrait" : "landscape";

  const flipHandler = deviceType === "mobile" ? onRequestFlip : undefined;
  const isMobilePortraitFullscreen = deviceType === "mobile" && layout === "portrait" && isFullscreen;
  const sideActionsVisible = layout === "landscape" || isMobilePortraitFullscreen;

  return (
    <CommonPlayerOverlay
      layout={layout}
      deviceType={deviceType}
      showControls={showControls}
      controlsLocked={controlsLocked}
      onUnlockControls={onUnlockControls}
      onLockControls={onLockControls}
      onToggleControls={onToggleControls}
      onInteract={onInteract}
      onRequestExit={onRequestExit}
      onRequestFlip={flipHandler}
      showSideActions={sideActionsVisible}
      isFullscreen={isFullscreen}
    />
  );
};

export default MobileTabletFullscreenControls;
