export type OverlayVariant =
  | "mobilePortrait"
  | "mobilePortraitFullscreen"
  | "mobileLandscape"
  | "tabletLandscape";
export type OverlayLayout = "portrait" | "landscape";

interface OverlayLayoutConfig {
  variant: OverlayVariant;
  contentStyles: string[];
  topRowStyles: string[];
  centerStyles: string[];
  bottomSectionStyles: string[];
  progressStyles: string[];
  bottomButtonsStyles: string[];
  showBottomButtons: boolean;
  showSideActions: boolean;
  alignSideRailCenter: boolean;
}

interface ResolveParams {
  deviceType: "mobile" | "tablet";
  layout: OverlayLayout;
  isFullscreen: boolean;
}

export const resolveOverlayLayoutConfig = ({
  deviceType,
  layout,
  isFullscreen,
}: ResolveParams): OverlayLayoutConfig => {
  if (deviceType === "mobile") {
    if (layout === "portrait") {
      if (isFullscreen) {
        return {
          variant: "mobilePortraitFullscreen",
          contentStyles: ["content", "contentPortrait", "mobilePortraitFullscreenContent"],
          topRowStyles: ["topRow", "mobilePortraitFullscreenTopRow"],
          centerStyles: ["centerControlsWrapper", "centerControlsPortrait", "mobilePortraitFullscreenCenter"],
          bottomSectionStyles: ["bottomSection", "bottomSectionPortrait", "mobilePortraitFullscreenBottomSection"],
          progressStyles: ["progressSection", "mobilePortraitFullscreenProgress"],
          bottomButtonsStyles: ["bottomButtonsRow", "mobilePortraitBottomButtons"],
          showBottomButtons: true,
          showSideActions: true,
          alignSideRailCenter: true,
        };
      }

      return {
        variant: "mobilePortrait",
        contentStyles: ["content", "contentPortrait", "mobilePortraitContent"],
        topRowStyles: ["topRow", "mobilePortraitTopRow"],
        centerStyles: ["centerControlsWrapper", "centerControlsPortrait", "mobilePortraitCenter"],
        bottomSectionStyles: ["bottomSection", "bottomSectionPortrait", "mobilePortraitBottomSection"],
        progressStyles: ["progressSection", "mobilePortraitProgress"],
        bottomButtonsStyles: ["bottomButtonsRow"],
        showBottomButtons: false,
        showSideActions: false,
        alignSideRailCenter: false,
      };
    }

    // mobile landscape (全屏)
    return {
      variant: "mobileLandscape",
      contentStyles: ["content", "contentLandscape", "mobileLandscapeContent"],
      topRowStyles: ["topRow"],
      centerStyles: ["centerControlsWrapper", "centerControlsLandscape", "mobileLandscapeCenterControls"],
      bottomSectionStyles: ["bottomSection", "bottomSectionLandscape", "mobileLandscapeBottomSection"],
      progressStyles: ["progressSection", "mobileLandscapeProgress"],
      bottomButtonsStyles: ["bottomButtonsRow", "mobileLandscapeBottomButtons"],
      showBottomButtons: true,
      showSideActions: true,
      alignSideRailCenter: false,
    };
  }

  // tablet landscape
  return {
    variant: "tabletLandscape",
    contentStyles: ["content", "contentLandscape", "tabletLandscapeContent"],
    topRowStyles: ["topRow"],
    centerStyles: ["centerControlsWrapper", "centerControlsLandscape", "tabletLandscapeCenterControls"],
    bottomSectionStyles: ["bottomSection", "bottomSectionLandscape", "tabletLandscapeBottomSection"],
    progressStyles: ["progressSection", "tabletLandscapeProgress"],
    bottomButtonsStyles: ["bottomButtonsRow", "tabletLandscapeBottomButtons"],
    showBottomButtons: true,
    showSideActions: true,
    alignSideRailCenter: false,
  };
};
