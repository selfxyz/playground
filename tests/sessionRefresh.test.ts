import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  scheduleSessionRefresh,
  SESSION_REFRESH_INTERVAL_MS,
} from '@/lib/sessionRefresh';

describe('scheduleSessionRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults to 10 minutes', () => {
    expect(SESSION_REFRESH_INTERVAL_MS).toBe(10 * 60 * 1000);
  });

  it('invokes rotate after the default interval', () => {
    const rotate = vi.fn();
    scheduleSessionRefresh(rotate);

    vi.advanceTimersByTime(SESSION_REFRESH_INTERVAL_MS - 1);
    expect(rotate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(rotate).toHaveBeenCalledTimes(1);
  });

  it('invokes rotate repeatedly on the interval', () => {
    const rotate = vi.fn();
    scheduleSessionRefresh(rotate, 5000);

    vi.advanceTimersByTime(5000);
    expect(rotate).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(rotate).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(15_000);
    expect(rotate).toHaveBeenCalledTimes(5);
  });

  it('cancel function stops further rotations', () => {
    const rotate = vi.fn();
    const cancel = scheduleSessionRefresh(rotate, 5000);

    vi.advanceTimersByTime(5000);
    expect(rotate).toHaveBeenCalledTimes(1);

    cancel();
    vi.advanceTimersByTime(20_000);
    expect(rotate).toHaveBeenCalledTimes(1);
  });
});
