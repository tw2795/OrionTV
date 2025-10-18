import React from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { Heart, Settings } from "lucide-react-native";
import { IconButton } from "@/components/player/overlays/shared/IconButton";
import { BatteryIndicator, formatClock } from "@/components/player/overlays/shared/systemStatus";
import { baseOverlayStyles } from "@/components/player/overlays/shared/baseStyles";
import type {
  OverlayCommonContext,
  PlaybackControlHandlers,
  PlaybackStateSnapshot,
  SystemStatusSnapshot,
  TitleMetadata,
} from "@/components/player/overlays/types";

export interface TopBarProps {
  context: OverlayCommonContext;
  title: TitleMetadata;
  systemStatus: SystemStatusSnapshot;
  playbackState: PlaybackStateSnapshot;
  controls: PlaybackControlHandlers;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}

const TopBar: React.FC<TopBarProps> = ({
  context,
  title,
  systemStatus,
  playbackState,
  controls,
  style,
  titleStyle,
  subtitleStyle,
}) => {
  const isPortrait = context.layout === "portrait";
  const combinedTitle =
    title.title && title.episodeLabel
      ? `${title.title}：${title.episodeLabel}`
      : title.title || title.episodeLabel;

  return (
    <View style={[baseOverlayStyles.topRow, style]}>
      <View style={baseOverlayStyles.titleContainer}>
        <Text
          style={[
            baseOverlayStyles.videoTitle,
            isPortrait && baseOverlayStyles.videoTitleCompact,
            titleStyle,
          ]}
          numberOfLines={1}
        >
          {combinedTitle}
        </Text>
        {title.sourceName ? (
          <Text style={[baseOverlayStyles.subtitle, subtitleStyle]} numberOfLines={1}>
            {title.sourceName}
          </Text>
        ) : null}
      </View>
      <View style={baseOverlayStyles.topActions}>
        <IconButton icon={Heart} onPress={controls.onFavorite} active={playbackState.isFavorited} size={context.topIconSize} />
        <IconButton icon={Settings} onPress={controls.onShowSpeedModal} size={context.topIconSize} />
        <View style={baseOverlayStyles.systemInfo}>
          <BatteryIndicator level={systemStatus.batteryLevel} />
          <Text style={baseOverlayStyles.systemInfoTime}>{formatClock(systemStatus.currentTime)}</Text>
        </View>
      </View>
    </View>
  );
};

export default TopBar;
