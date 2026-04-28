export type LatestRequestTracker = {
  next: () => number;
  isLatest: (id: number) => boolean;
  invalidate: () => void;
};

export function createLatestRequestTracker(): LatestRequestTracker {
  let currentId = 0;
  return {
    next: () => ++currentId,
    isLatest: (id: number) => id === currentId,
    invalidate: () => {
      currentId += 1;
    },
  };
}
