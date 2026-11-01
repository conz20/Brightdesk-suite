'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const renderer = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const catalog = require('../src/app-catalog');

test('To Do has a dedicated task workspace instead of the generic document editor', () => {
  assert.match(html, /id="todo-wrap"/);
  assert.match(html, /id="todo-create-form"/);
  assert.match(html, /id="todo-task-list"/);
  assert.match(renderer, /function renderTodoWorkspace\(\)/);
  assert.match(renderer, /if \(isTodo\) renderTodoWorkspace\(\)/);
  assert.match(renderer, /todo: \{ title: 'Brightdesk To Do'/);
  assert.match(renderer, /todo: \{ title: 'My tasks', tasks: \[\] \}/);
});

test('To Do task controls are wired to the tested task service and local save flow', () => {
  assert.match(html, /data-todo-view="my-day"/);
  assert.match(html, /data-todo-view="important"/);
  assert.match(html, /data-todo-view="planned"/);
  assert.match(html, /data-todo-view="tasks"/);
  assert.match(html, /data-todo-view="completed"/);
  assert.match(renderer, /BrightdeskTodoService\.createTask/);
  assert.match(renderer, /BrightdeskTodoService\.updateTask/);
  assert.match(renderer, /BrightdeskTodoService\.setCompleted/);
  assert.match(renderer, /BrightdeskTodoService\.deleteTask/);
  assert.match(renderer, /function saveTodoTasks\(\) \{ persist\(\)/);
  assert.ok(html.indexOf('src="todo-service.js"') < html.indexOf('src="app.js"'));
});

test('To Do has its own responsive task styling and keyboard-operable controls', () => {
  assert.match(css, /\.todo-app\{/);
  assert.match(css, /@media\(max-width:760px\)\{\.todo-app/);
  assert.match(html, /aria-label="New task title"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /role="status"/);
});

test('To Do is registered as a separate Brightdesk app with its own navigation config', () => {
  const todo = catalog.find(item => item.id === 'todo');
  assert.ok(todo);
  assert.equal(todo.name, 'Brightdesk To Do');
  assert.match(renderer, /todo: \{ title: 'Brightdesk To Do'/);
  assert.match(renderer, /function setApp\(app\).*configs\[app\] \|\| genericConfigs\[app\]/);
});
