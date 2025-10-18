import { StyleSheet } from "react-native";

export const baseOverlayStyles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  contentPortrait: {
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  contentLandscape: {
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  videoTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  videoTitleCompact: {
    fontSize: 18,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 4,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  systemInfo: {
    alignItems: "flex-end",
    gap: 4,
  },
  systemInfoTime: {
    color: "#fff",
    fontSize: 12,
  },
  centerControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 48,
    alignSelf: "center",
  },
  centerControlsPortrait: {
    marginTop: 24,
    gap: 36,
  },
  centerControlsLandscape: {
    marginTop: 12,
  },
  bottomSection: {
    gap: 16,
  },
  bottomSectionPortrait: {
    paddingBottom: 4,
  },
  bottomSectionLandscape: {
    paddingBottom: 0,
    gap: 14,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  timeLabel: {
    color: "#fff",
    fontSize: 14,
    minWidth: 52,
    textAlign: "center",
  },
  timeLabelCompact: {
    fontSize: 12,
    minWidth: 44,
  },
  progressBarContainer: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  progressBackground: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  progressBuffered: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  bottomButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  bottomButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  bottomButtonTextActive: {
    color: "#00D8A4",
    fontWeight: "600",
  },
  lockContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 24,
  },
  lockButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 999,
    padding: 12,
  },
});
