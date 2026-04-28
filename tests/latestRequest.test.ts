import { describe, expect, it, vi } from 'vitest';

import { createLatestRequestTracker } from '@/lib/latestRequest';

describe('createLatestRequestTracker', () => {
  it('marks only the most recently issued id as latest', () => {
    const tracker = createLatestRequestTracker();
    const a = tracker.next();
    const b = tracker.next();

    expect(tracker.isLatest(a)).toBe(false);
    expect(tracker.isLatest(b)).toBe(true);

    const c = tracker.next();
    expect(tracker.isLatest(b)).toBe(false);
    expect(tracker.isLatest(c)).toBe(true);
  });

  it('protects against stale-resolution races (in-flight rotation)', async () => {
    const tracker = createLatestRequestTracker();
    let setToken: string | null = null;

    const deferred = <T>() => {
      let resolve!: (v: T) => void;
      const promise = new Promise<T>(r => {
        resolve = r;
      });
      return { promise, resolve };
    };

    const first = deferred<string>();
    const second = deferred<string>();

    const runRequest = async (
      id: number,
      result: Promise<string>,
    ): Promise<void> => {
      const t = await result;
      if (!tracker.isLatest(id)) return;
      setToken = t;
    };

    const idA = tracker.next();
    const pA = runRequest(idA, first.promise);

    const idB = tracker.next();
    const pB = runRequest(idB, second.promise);

    first.resolve('stale-token');
    await pA;
    expect(setToken).toBeNull();

    second.resolve('fresh-token');
    await pB;
    expect(setToken).toBe('fresh-token');
  });

  it('rotation triggers a refetch keyed to the new id', async () => {
    const tracker = createLatestRequestTracker();
    const fetcher = vi
      .fn<(userId: string) => Promise<string>>()
      .mockImplementation(async u => `token-for-${u}`);

    const prefetch = async (userId: string): Promise<string | null> => {
      const id = tracker.next();
      const t = await fetcher(userId);
      return tracker.isLatest(id) ? t : null;
    };

    const a = await prefetch('user-a');
    expect(a).toBe('token-for-user-a');

    const b = await prefetch('user-b');
    expect(b).toBe('token-for-user-b');

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenNthCalledWith(1, 'user-a');
    expect(fetcher).toHaveBeenNthCalledWith(2, 'user-b');
  });
});
