export const SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function scheduleSessionRefresh(
  rotate: () => void,
  intervalMs: number = SESSION_REFRESH_INTERVAL_MS,
): () => void {
  const intervalId = setInterval(rotate, intervalMs);
  return () => clearInterval(intervalId);
}
