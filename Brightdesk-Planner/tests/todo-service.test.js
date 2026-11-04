'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const todo = require('../src/todo-service');

const fixed = { now: new Date('2026-11-02T10:00:00.000Z'), id: 'task-1' };

test('creates a task with a trimmed title and safe defaults', () => {
  const task = todo.createTask({ title: '  Buy milk  ' }, fixed);
  assert.equal(task.id, 'task-1');
  assert.equal(task.title, 'Buy milk');
  assert.equal(task.notes, '');
  assert.equal(task.priority, 'normal');
  assert.equal(task.important, false);
  assert.equal(task.myDay, false);
  assert.equal(task.completed, false);
  assert.equal(task.completedAt, null);
  assert.equal(task.createdAt, '2026-11-02T10:00:00.000Z');
});

test('rejects an empty or whitespace-only task title', () => {
  assert.throws(() => todo.createTask({ title: '' }, fixed), /title is required/i);
  assert.throws(() => todo.createTask({ title: '   ' }, fixed), /title is required/i);
});

test('rejects invalid due dates and priorities', () => {
  assert.throws(() => todo.createTask({ title: 'Task', dueDate: '02/11/2026' }, fixed), /valid due date/i);
  assert.throws(() => todo.createTask({ title: 'Task', priority: 'urgent' }, fixed), /priority/i);
});

test('updates task details and the updated timestamp', () => {
  const task = todo.createTask({ title: 'Draft report' }, fixed);
  const updated = todo.updateTask(task, { title: '  Finish report ', notes: 'Send to the team', dueDate: '2026-11-05', priority: 'high' }, { now: new Date('2026-11-03T08:00:00.000Z') });
  assert.equal(updated.title, 'Finish report');
  assert.equal(updated.notes, 'Send to the team');
  assert.equal(updated.dueDate, '2026-11-05');
  assert.equal(updated.priority, 'high');
  assert.equal(updated.updatedAt, '2026-11-03T08:00:00.000Z');
  assert.equal(updated.completed, false);
});

test('completes and restores a task with a completion timestamp', () => {
  const task = todo.createTask({ title: 'Call the dentist' }, fixed);
  const completed = todo.setCompleted(task, true, { now: new Date('2026-11-02T11:00:00.000Z') });
  assert.equal(completed.completed, true);
  assert.equal(completed.completedAt, '2026-11-02T11:00:00.000Z');
  const restored = todo.setCompleted(completed, false, { now: new Date('2026-11-02T12:00:00.000Z') });
  assert.equal(restored.completed, false);
  assert.equal(restored.completedAt, null);
});

test('filters smart views and searches title and notes case-insensitively', () => {
  const tasks = [
    todo.createTask({ title: 'Buy milk', myDay: true }, { ...fixed, id: '1' }),
    todo.createTask({ title: 'Prepare report', notes: 'For Monday', important: true, dueDate: '2026-11-03' }, { ...fixed, id: '2' }),
    todo.createTask({ title: 'Book dentist', dueDate: '2026-11-04' }, { ...fixed, id: '3' }),
    todo.setCompleted(todo.createTask({ title: 'Old task' }, { ...fixed, id: '4' }), true, { now: fixed.now })
  ];
  assert.deepEqual(todo.filterTasks(tasks, { view: 'my-day', today: '2026-11-02' }).map(t => t.id), ['1']);
  assert.deepEqual(todo.filterTasks(tasks, { view: 'important', today: '2026-11-02' }).map(t => t.id), ['2']);
  assert.deepEqual(todo.filterTasks(tasks, { view: 'planned', today: '2026-11-02' }).map(t => t.id), ['2', '3']);
  assert.deepEqual(todo.filterTasks(tasks, { view: 'completed', today: '2026-11-02' }).map(t => t.id), ['4']);
  assert.deepEqual(todo.filterTasks(tasks, { view: 'tasks', query: 'MONDAY', today: '2026-11-02' }).map(t => t.id), ['2']);
});

test('deletes only the selected task', () => {
  const tasks = [
    todo.createTask({ title: 'First' }, { ...fixed, id: 'first' }),
    todo.createTask({ title: 'Second' }, { ...fixed, id: 'second' })
  ];
  assert.deepEqual(todo.deleteTask(tasks, 'first').map(t => t.id), ['second']);
  assert.equal(tasks.length, 2);
});
