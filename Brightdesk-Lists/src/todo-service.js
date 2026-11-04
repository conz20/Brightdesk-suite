(function attachBrightdeskTodoService(root) {
  'use strict';

  const priorities = new Set(['low', 'normal', 'high']);

  function timestamp(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) throw new Error('A valid date is required.');
    return date.toISOString();
  }

  function validateDueDate(value) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error('Enter a valid due date.');
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new Error('Enter a valid due date.');
    }
    return value;
  }

  function validateTitle(value) {
    const title = String(value ?? '').trim();
    if (!title) throw new Error('A task title is required.');
    if (title.length > 240) throw new Error('Task titles must be 240 characters or fewer.');
    return title;
  }

  function validatePriority(value) {
    const priority = value ?? 'normal';
    if (!priorities.has(priority)) throw new Error('Choose low, normal or high priority.');
    return priority;
  }

  function makeId() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function createTask(input = {}, options = {}) {
    const now = timestamp(options.now);
    return {
      id: options.id || makeId(),
      title: validateTitle(input.title),
      notes: String(input.notes ?? ''),
      dueDate: validateDueDate(input.dueDate),
      priority: validatePriority(input.priority),
      important: input.important === true,
      myDay: input.myDay === true,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };
  }

  function updateTask(task, patch = {}, options = {}) {
    if (!task || typeof task !== 'object' || !task.id) throw new Error('A valid task is required.');
    const updated = { ...task };
    if (Object.prototype.hasOwnProperty.call(patch, 'title')) updated.title = validateTitle(patch.title);
    if (Object.prototype.hasOwnProperty.call(patch, 'notes')) updated.notes = String(patch.notes ?? '');
    if (Object.prototype.hasOwnProperty.call(patch, 'dueDate')) updated.dueDate = validateDueDate(patch.dueDate);
    if (Object.prototype.hasOwnProperty.call(patch, 'priority')) updated.priority = validatePriority(patch.priority);
    if (Object.prototype.hasOwnProperty.call(patch, 'important')) updated.important = patch.important === true;
    if (Object.prototype.hasOwnProperty.call(patch, 'myDay')) updated.myDay = patch.myDay === true;
    updated.updatedAt = timestamp(options.now);
    return updated;
  }

  function setCompleted(task, completed, options = {}) {
    const isCompleted = completed === true;
    if (task.completed === isCompleted) return task;
    const now = timestamp(options.now);
    return {
      ...task,
      completed: isCompleted,
      completedAt: isCompleted ? now : null,
      updatedAt: now
    };
  }

  function deleteTask(tasks, id) {
    return (Array.isArray(tasks) ? tasks : []).filter(task => task.id !== id);
  }

  function filterTasks(tasks, options = {}) {
    const view = options.view || 'tasks';
    const query = String(options.query || '').trim().toLocaleLowerCase();
    const today = options.today || new Date().toISOString().slice(0, 10);
    const filtered = (Array.isArray(tasks) ? tasks : []).filter(task => {
      if (view === 'completed' ? !task.completed : task.completed) return false;
      if (view === 'my-day' && !task.myDay) return false;
      if (view === 'important' && !task.important) return false;
      if (view === 'planned' && !task.dueDate) return false;
      if (query && !`${task.title} ${task.notes}`.toLocaleLowerCase().includes(query)) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return String(a.createdAt).localeCompare(String(b.createdAt));
    });
  }

  const service = { createTask, updateTask, setCompleted, deleteTask, filterTasks };
  root.BrightdeskTodoService = service;
  if (typeof module !== 'undefined' && module.exports) module.exports = service;
})(typeof globalThis !== 'undefined' ? globalThis : window);
