/**
 * Format time in milliseconds to human-readable string
 * Automatically chooses between mm:ss and hh:mm:ss format based on duration
 *
 * @param milliseconds - Time in milliseconds
 * @returns Formatted time string (mm:ss or hh:mm:ss)
 */
export const formatTime = (milliseconds: number): string => {
  if (!milliseconds || milliseconds < 0) return "00:00";

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Use hh:mm:ss format if duration is 1 hour or more
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  // Use mm:ss format for durations less than 1 hour
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
