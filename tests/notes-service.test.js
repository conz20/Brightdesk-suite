'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createNote,
  updateNoteText,
  insertText,
  clearNoteText,
  exportPayload
} = require('../src/notes-service');

test('Notes creates a titled quick note with empty text by default', () => {
  assert.deepEqual(createNote(), { title: 'Untitled note', text: '' });
});

test('Notes stores edited text without changing the note title', () => {
  const note = createNote({ title: 'Meeting ideas' });

  updateNoteText(note, 'Discuss the next release');

  assert.deepEqual(note, { title: 'Meeting ideas', text: 'Discuss the next release' });
});

test('Notes inserts text at the current cursor position', () => {
  const result = insertText('Brightdesk notes', 11, 11, 'quick ');

  assert.deepEqual(result, {
    text: 'Brightdesk quick notes',
    selectionStart: 17,
    selectionEnd: 17
  });
});

test('Notes replaces the selected text when inserting a checklist item or date', () => {
  const result = insertText('Add text here', 4, 8, '☐ ');

  assert.deepEqual(result, {
    text: 'Add ☐ here',
    selectionStart: 6,
    selectionEnd: 6
  });
});

test('Notes clamps invalid selection positions safely', () => {
  const result = insertText('Hello', -10, 99, '!');

  assert.deepEqual(result, { text: '!', selectionStart: 1, selectionEnd: 1 });
});

test('Notes clears only the note text', () => {
  const note = createNote({ title: 'Saved title', text: 'Old note' });

  updateNoteText(note, clearNoteText());

  assert.deepEqual(note, { title: 'Saved title', text: '' });
});

test('Notes exports the current title and text using the Brightdesk project shape', () => {
  const note = createNote({ title: 'Shopping list', text: 'Milk\nBread' });

  assert.deepEqual(exportPayload(note), {
    kind: 'notes',
    title: 'Shopping list',
    text: 'Milk\nBread'
  });
});
