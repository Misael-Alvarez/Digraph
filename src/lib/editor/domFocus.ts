/**
 * True when the event target is somewhere the user is entering text.
 *
 * `contenteditable` matters as much as `input` and `textarea`: CodeMirror
 * renders into a contenteditable div, so a shortcut handler that only checks
 * tag names will steal keystrokes from the code editor — including the space
 * bar, which the canvas uses for panning.
 */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable === true ||
    element.closest?.('[contenteditable="true"]') !== null
  );
}
