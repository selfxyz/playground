export const DEFAULT_ICON_URL =
  'https://image2url.com/r2/default/images/1772123009674-14365df5-cc03-433d-9c21-814d43ad2fb8.png';

// Only allow http(s) URLs into <img src> / QR payload to block javascript: and data: vectors (CodeQL).
export function sanitizeIconUrl(candidate: string): string {
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // fall through
  }
  return DEFAULT_ICON_URL;
}
