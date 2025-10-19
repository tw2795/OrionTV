import React, { isValidElement, cloneElement } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import type { OverlayCommonContext } from "@/components/player/overlays/types";
import { useVideoOverlayLayout, type SectionKey } from "@/components/player/overlays/hooks/useVideoOverlayLayout";

interface OverlayLayoutProps {
  context: OverlayCommonContext;
  isFullscreen?: boolean;
  topBar?: React.ReactNode;
  centerControls?: React.ReactNode;
  progressSection?: React.ReactNode;
  bottomControls?: React.ReactNode;
  bottomButtons?: React.ReactNode;
  sideRail?: React.ReactNode;
}

type LayoutHandlerFactory = (section: SectionKey) => (event: LayoutChangeEvent) => void;

const renderSlot = (
  slot: React.ReactNode | undefined,
  section: SectionKey,
  style: ViewStyle,
  getHandler: LayoutHandlerFactory
) => {
  if (!slot) {
    return null;
  }

  const handleLayout = getHandler(section);

  if (isValidElement(slot)) {
    const existingOnLayout = (slot.props as { onLayout?: (event: LayoutChangeEvent) => void }).onLayout;
    const existingStyle = (slot.props as { style?: StyleProp<ViewStyle> }).style;

    const mergedOnLayout = (event: LayoutChangeEvent) => {
      existingOnLayout?.(event);
      handleLayout(event);
    };

    const mergedStyle: StyleProp<ViewStyle> = existingStyle ? [existingStyle, style] : style;

    return cloneElement(slot as React.ReactElement<any>, {
      onLayout: mergedOnLayout,
      style: mergedStyle,
    } as Record<string, unknown>);
  }

  return (
    <View style={style} onLayout={handleLayout} pointerEvents="box-none">
      {slot}
    </View>
  );
};

const OverlayLayout: React.FC<OverlayLayoutProps> = ({
  context,
  isFullscreen = false,
  topBar,
  centerControls,
  progressSection,
  bottomControls,
  bottomButtons,
  sideRail,
}) => {
  const { styles, handleContainerLayout, getSectionLayoutHandler } = useVideoOverlayLayout({
    layout: context.layout,
    variant: context.variant,
    deviceType: context.deviceType,
    isFullscreen,
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={handleContainerLayout}>
      <View style={[styles.container]} pointerEvents="box-none">
        {renderSlot(topBar, "topBar", styles.topBar, getSectionLayoutHandler)}
        {renderSlot(centerControls, "centerControls", styles.centerControls, getSectionLayoutHandler)}
        {renderSlot(progressSection, "progress", styles.progress, getSectionLayoutHandler)}
        {renderSlot(bottomControls, "bottomControls", styles.bottomControls, getSectionLayoutHandler)}
        {renderSlot(bottomButtons, "bottomButtons", styles.bottomButtons, getSectionLayoutHandler)}
        {renderSlot(sideRail, "sideRail", styles.sideRail, getSectionLayoutHandler)}
      </View>
    </View>
  );
};

export default OverlayLayout;
