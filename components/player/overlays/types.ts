import type { GestureResponderHandlers, LayoutChangeEvent } from "react-native";
import type { OverlayLayout, OverlayVariant } from "./layoutConfig";

export interface ProgressGestureHandlers extends GestureResponderHandlers {
  onProgressPress?: (locationX: number) => void;
}

export interface ProgressSectionPayload {
  currentTimeLabel: string;
  durationLabel: string;
  currentProgress: number;
  bufferedProgress: number;
  progressWidth: number;
  knobSize?: number;
  onProgressLayout: (event: LayoutChangeEvent) => void;
  onProgressPress: (locationX: number) => void;
  panHandlers: GestureResponderHandlers;
  showFullscreenToggle?: boolean;
  onToggleFullscreen?: () => void;
}

export interface OverlayCommonContext {
  layout: OverlayLayout;
  variant: OverlayVariant;
  deviceType: "mobile" | "tablet";
  showSideActions: boolean;
  alignSideRailCenter: boolean;
  showBottomButtons: boolean;
  topIconSize: number;
}

export interface PlaybackControlHandlers {
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  onFavorite: () => void;
  onIntroToggle: () => void;
  onOutroToggle: () => void;
  onShowEpisodeModal: () => void;
  onShowSourceModal: () => void;
  onShowSpeedModal: () => void;
  onLockControls: () => void;
  onUnlockControls: () => void;
  onRequestExit?: () => void;
  onRequestFlip?: () => void;
  onToggleFullscreen?: () => void;
}

export interface PlaybackStateSnapshot {
  isPlaying: boolean;
  hasNextEpisode: boolean;
  hasPreviousEpisode: boolean;
  isFavorited: boolean;
  introMarked: boolean;
  outroMarked: boolean;
}

export interface TitleMetadata {
  title: string;
  episodeLabel: string;
  sourceName?: string | null;
}

export interface SystemStatusSnapshot {
  batteryLevel: number | null;
  currentTime: Date;
}

export interface OverlayComponentProps {
  context: OverlayCommonContext;
  titleMetadata: TitleMetadata;
  playbackState: PlaybackStateSnapshot;
  progress: ProgressSectionPayload;
  systemStatus: SystemStatusSnapshot;
  controls: PlaybackControlHandlers;
}
