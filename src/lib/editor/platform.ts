/**
 * How this platform writes a keyboard shortcut.
 *
 * The same three lines were repeated in the command palette, the empty state,
 * the tool dock and the context menu — and three of those four had the Mac
 * glyph hard-coded, so on Windows and Linux the app advertised a key that does
 * nothing there.
 *
 * `navigator.platform` is deprecated but is still the only signal every browser
 * agrees on; `userAgentData` is Chromium-only and consulted first where it
 * exists. With no navigator at all the answer is the Windows spelling — no
 * caller renders on the server today, and it is the safer guess besides.
 */
interface UserAgentData {
  platform?: string;
}

export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  // `||`, not `??`: Chromium can report an empty string for the hint, and an
  // empty string is an answer `??` would keep.
  return /mac/i.test(data?.platform || navigator.platform || navigator.userAgent || '');
}

/** The modifier prefix on its own: `⌘` on a Mac, `Ctrl+` everywhere else. */
export function modKey(): string {
  return isMac() ? '⌘' : 'Ctrl+';
}

/** A shortcut spelled for this platform: `shortcut('K')` → `⌘K` or `Ctrl+K`. */
export function shortcut(key: string): string {
  return `${modKey()}${key}`;
}
