'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const lists = require('../src/lists-service');

const fixed = { now: new Date('2026-11-02T10:00:00.000Z'), id: 'list-1' };

test('creates a named list with standard tracking columns', () => {
  const list = lists.createList({ title: '  Website launch  ', description: 'Track launch work' }, fixed);
  assert.equal(list.id, 'list-1');
  assert.equal(list.title, 'Website launch');
  assert.equal(list.description, 'Track launch work');
  assert.deepEqual(list.columns.map(column => column.name), ['Title', 'Status', 'Priority', 'Due date', 'Notes']);
  assert.deepEqual(list.items, []);
  assert.equal(list.createdAt, '2026-11-02T10:00:00.000Z');
});

test('rejects blank list names and invalid column types', () => {
  assert.throws(() => lists.createList({ title: '  ' }, fixed), /list name is required/i);
  assert.throws(() => lists.addColumn(lists.createList({ title: 'Stock' }, fixed), { name: 'Cost', type: 'currency' }), /column type/i);
});

test('adds and renames custom columns without losing existing values', () => {
  let list = lists.createList({ title: 'Inventory' }, fixed);
  list = lists.addColumn(list, { name: 'Location', type: 'text' }, { id: 'col-location' });
  list = lists.addItem(list, { values: { title: 'Laptop', status: 'In progress', 'col-location': 'Office' } }, { id: 'item-1' });
  list = lists.renameColumn(list, 'col-location', 'Storage area');
  assert.equal(list.columns.find(column => column.id === 'col-location').name, 'Storage area');
  assert.equal(list.items[0].values['col-location'], 'Office');
});

test('adds records with validated values and supports editing', () => {
  let list = lists.createList({ title: 'Assets' }, fixed);
  list = lists.addItem(list, { values: { title: 'Laptop', status: 'Not started', priority: 'High', 'due-date': '2026-11-05', notes: 'Work device' } }, { id: 'item-1' });
  assert.equal(list.items[0].values.title, 'Laptop');
  assert.equal(list.items[0].values.priority, 'High');
  assert.equal(list.items[0].values['due-date'], '2026-11-05');
  list = lists.updateItem(list, 'item-1', { values: { status: 'Done', notes: 'Assigned' } });
  assert.equal(list.items[0].values.status, 'Done');
  assert.equal(list.items[0].values.notes, 'Assigned');
  assert.equal(list.items[0].values.title, 'Laptop');
});

test('requires a record title and rejects invalid dates or status values', () => {
  const list = lists.createList({ title: 'Tasks' }, fixed);
  assert.throws(() => lists.addItem(list, { values: { title: '   ' } }, { id: 'bad' }), /record title is required/i);
  assert.throws(() => lists.addItem(list, { values: { title: 'Task', 'due-date': 'tomorrow' } }, { id: 'bad' }), /valid due date/i);
  assert.throws(() => lists.addItem(list, { values: { title: 'Task', status: 'Blocked forever' } }, { id: 'bad' }), /status/i);
});

test('filters records by text and status and sorts by supported fields', () => {
  let list = lists.createList({ title: 'Tasks' }, fixed);
  list = lists.addItem(list, { values: { title: 'Prepare report', status: 'In progress', priority: 'High' } }, { id: '1' });
  list = lists.addItem(list, { values: { title: 'Buy supplies', status: 'Not started', priority: 'Low' } }, { id: '2' });
  list = lists.addItem(list, { values: { title: 'Send report', status: 'Done', priority: 'Normal' } }, { id: '3' });
  assert.deepEqual(lists.filterItems(list, { query: 'REPORT' }).map(item => item.id), ['1', '3']);
  assert.deepEqual(lists.filterItems(list, { status: 'In progress' }).map(item => item.id), ['1']);
  assert.deepEqual(lists.sortItems(list.items, 'priority', 'asc').map(item => item.id), ['2', '3', '1']);
});

test('deletes individual records and custom columns without corrupting other data', () => {
  let list = lists.createList({ title: 'Contacts' }, fixed);
  list = lists.addColumn(list, { name: 'Email', type: 'text' }, { id: 'email' });
  list = lists.addItem(list, { values: { title: 'Alex', email: 'alex@example.com' } }, { id: '1' });
  list = lists.addItem(list, { values: { title: 'Sam', email: 'sam@example.com' } }, { id: '2' });
  list = lists.deleteColumn(list, 'email');
  assert.equal(list.items[0].values.email, undefined);
  list = lists.deleteItem(list, '1');
  assert.deepEqual(list.items.map(item => item.id), ['2']);
});

test('renames a list and rejects duplicate custom column names', () => {
  let list = lists.createList({ title: 'Old name' }, fixed);
  list = lists.renameList(list, 'New name');
  assert.equal(list.title, 'New name');
  assert.throws(() => lists.addColumn(list, { name: 'Status', type: 'text' }), /already exists/i);
});
