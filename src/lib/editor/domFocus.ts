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
  // A detached node cannot be receiving typing. Focus can be left pointing at
  // one after a panel closes, and treating that as "the user is typing" silently
  // disables every shortcut in the app.
  if (element.isConnected === false) return false;
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable === true ||
    element.closest?.('[contenteditable="true"]') !== null
  );
}
