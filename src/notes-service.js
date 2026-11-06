'use strict';

(function (root, factory) {
  const service = factory();
  if (typeof module === 'object' && module.exports) module.exports = service;
  if (root) root.BrightdeskNotesService = service;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function createNote(input = {}) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    return {
      title: String(source.title ?? 'Untitled note'),
      text: String(source.text ?? '')
    };
  }

  function updateNoteText(note, text) {
    if (!note || typeof note !== 'object' || Array.isArray(note)) {
      throw new TypeError('A note object is required.');
    }
    note.text = String(text ?? '');
    return note;
  }

  function safeOffset(value, length) {
    if (!Number.isInteger(value)) return 0;
    return Math.max(0, Math.min(value, length));
  }

  function insertText(text, selectionStart, selectionEnd, insertion) {
    const current = String(text ?? '');
    const first = safeOffset(selectionStart, current.length);
    const last = safeOffset(selectionEnd, current.length);
    const start = Math.min(first, last);
    const end = Math.max(first, last);
    const inserted = String(insertion ?? '');
    const next = current.slice(0, start) + inserted + current.slice(end);
    const caret = start + inserted.length;
    return { text: next, selectionStart: caret, selectionEnd: caret };
  }

  function clearNoteText() {
    return '';
  }

  function exportPayload(note, textOverride) {
    if (!note || typeof note !== 'object' || Array.isArray(note)) {
      throw new TypeError('A note object is required.');
    }
    return {
      kind: 'notes',
      title: String(note.title ?? 'Untitled note'),
      text: String(textOverride ?? note.text ?? '')
    };
  }

  return {
    createNote,
    updateNoteText,
    insertText,
    clearNoteText,
    exportPayload
  };
});
