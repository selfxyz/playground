export type LatestRequestTracker = {
  next: () => number;
  isLatest: (id: number) => boolean;
};

export function createLatestRequestTracker(): LatestRequestTracker {
  let currentId = 0;
  return {
    next: () => ++currentId,
    isLatest: (id: number) => id === currentId,
  };
}
