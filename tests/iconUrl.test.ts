import { describe, expect, it } from 'vitest';

import { DEFAULT_ICON_URL, sanitizeIconUrl } from '@/lib/iconUrl';

describe('sanitizeIconUrl', () => {
  it('allows https URLs', () => {
    expect(sanitizeIconUrl('https://example.com/icon.png')).toBe(
      'https://example.com/icon.png',
    );
  });

  it('allows http URLs', () => {
    expect(sanitizeIconUrl('http://example.com/icon.png')).toBe(
      'http://example.com/icon.png',
    );
  });

  it('preserves query strings and fragments', () => {
    expect(sanitizeIconUrl('https://example.com/icon.png?size=2#preview')).toBe(
      'https://example.com/icon.png?size=2#preview',
    );
  });

  it('rejects javascript URLs', () => {
    expect(sanitizeIconUrl('javascript:alert(1)')).toBe(DEFAULT_ICON_URL);
  });

  it('rejects data URLs', () => {
    expect(sanitizeIconUrl('data:text/html,<script>alert(1)</script>')).toBe(
      DEFAULT_ICON_URL,
    );
  });

  it('rejects malformed and empty values', () => {
    expect(sanitizeIconUrl('not a url')).toBe(DEFAULT_ICON_URL);
    expect(sanitizeIconUrl('')).toBe(DEFAULT_ICON_URL);
  });

  it('accepts surrounding whitespace when the parsed URL is otherwise valid', () => {
    expect(sanitizeIconUrl(' https://example.com/icon.png ')).toBe(
      'https://example.com/icon.png',
    );
  });
});
