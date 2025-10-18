import React from "react";
import { CenterPlayOverlay } from "@/components/CenterPlayOverlay";
import { PlayerControls } from "@/components/PlayerControls";
import { SeekingBar } from "@/components/SeekingBar";

interface TvOverlayProps {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
}

const TvOverlay: React.FC<TvOverlayProps> = ({ showControls, setShowControls }) => (
  <>
    {showControls && <CenterPlayOverlay />}
    {showControls && <PlayerControls showControls={showControls} setShowControls={setShowControls} />}
    <SeekingBar />
  </>
);

export default TvOverlay;

