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
}) => {
  const layout = isPortrait ? "portrait" : "landscape";

  const flipHandler = deviceType === "mobile" ? onRequestFlip : undefined;

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
      showSideActions={layout === "landscape"}
    />
  );
};

export default MobileTabletFullscreenControls;
