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
  showFavoriteButton?: boolean;
  showSettingsButton?: boolean;
  showBatteryStatus?: boolean;
  showClock?: boolean;
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
  showFavoriteButton = true,
  showSettingsButton = true,
  showBatteryStatus = true,
  showClock = true,
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
        {showFavoriteButton ? (
          <IconButton
            icon={Heart}
            onPress={controls.onFavorite}
            active={playbackState.isFavorited}
            size={context.topIconSize}
          />
        ) : null}
        {showSettingsButton ? (
          <IconButton icon={Settings} onPress={controls.onShowSpeedModal} size={context.topIconSize} />
        ) : null}
        {(showBatteryStatus || showClock) && (
          <View style={baseOverlayStyles.systemInfo}>
            {showBatteryStatus ? <BatteryIndicator level={systemStatus.batteryLevel} /> : null}
            {showClock ? <Text style={baseOverlayStyles.systemInfoTime}>{formatClock(systemStatus.currentTime)}</Text> : null}
          </View>
        )}
      </View>
    </View>
  );
};

export default TopBar;
