/**
 * Utility functions for precise time calculations and formatting
 */

export function formatElapsed(ms: number | null | undefined, showMilliseconds: boolean = true): string {
  if (ms === null || ms === undefined || ms < 0) {
    return '--:--.--';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10); // 2 digits (centiseconds)

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const timeStr = hours > 0 
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  if (!showMilliseconds) {
    return timeStr;
  }

  return `${timeStr}.${pad(milliseconds)}`;
}

export function formatTimeOfDay(timestamp: number | null | undefined): string {
  if (!timestamp) return '--:--:--';
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDurationSummary(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}p`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}
