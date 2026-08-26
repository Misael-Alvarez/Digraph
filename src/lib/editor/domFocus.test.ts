import { describe, expect, it } from 'vitest';
import { isTextEntryTarget } from './domFocus';

/** Minimal element stand-in; the helper only reads these three things. */
function element(tagName: string, contentEditable = false, insideEditor = false) {
  return {
    tagName,
    isContentEditable: contentEditable,
    closest: (selector: string) =>
      selector === '[contenteditable="true"]' && insideEditor ? {} : null,
  } as unknown as EventTarget;
}

describe('isTextEntryTarget', () => {
  it('recognises form fields', () => {
    expect(isTextEntryTarget(element('INPUT'))).toBe(true);
    expect(isTextEntryTarget(element('TEXTAREA'))).toBe(true);
    expect(isTextEntryTarget(element('SELECT'))).toBe(true);
  });

  it('recognises a contenteditable host', () => {
    expect(isTextEntryTarget(element('DIV', true))).toBe(true);
  });

  it('recognises a node nested inside a contenteditable', () => {
    // CodeMirror puts the caret in a child span, not the editable div itself,
    // which is how the space bar ended up being swallowed while typing.
    expect(isTextEntryTarget(element('SPAN', false, true))).toBe(true);
  });

  it('does not claim ordinary elements', () => {
    expect(isTextEntryTarget(element('DIV'))).toBe(false);
    expect(isTextEntryTarget(element('BUTTON'))).toBe(false);
    expect(isTextEntryTarget(null)).toBe(false);
  });
});
