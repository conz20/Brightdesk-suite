(function attachBrightdeskLists(root) {
  'use strict';

  const statuses = ['Not started', 'In progress', 'Done'];
  const priorities = ['Low', 'Normal', 'High'];
  const types = new Set(['text', 'date', 'choice']);

  function stamp(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) throw new Error('A valid date is required.');
    return date.toISOString();
  }
  function makeId(prefix) {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function requiredName(value, label) {
    const name = String(value ?? '').trim();
    if (!name) throw new Error(`A ${label} is required.`);
    if (name.length > 100) throw new Error(`${label[0].toUpperCase() + label.slice(1)} must be 100 characters or fewer.`);
    return name;
  }
  function dueDate(value) {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Enter a valid due date.');
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error('Enter a valid due date.');
    return value;
  }
  function defaultColumns() {
    return [
      { id: 'title', name: 'Title', type: 'text', required: true, builtIn: true },
      { id: 'status', name: 'Status', type: 'choice', options: statuses.slice(), required: true, builtIn: true },
      { id: 'priority', name: 'Priority', type: 'choice', options: priorities.slice(), required: true, builtIn: true },
      { id: 'due-date', name: 'Due date', type: 'date', required: false, builtIn: true },
      { id: 'notes', name: 'Notes', type: 'text', required: false, builtIn: true }
    ];
  }
  function createList(input = {}, options = {}) {
    const now = stamp(options.now);
    return {
      id: options.id || makeId('list'),
      title: requiredName(input.title, 'list name'),
      description: String(input.description ?? ''),
      columns: defaultColumns(),
      items: [],
      createdAt: now,
      updatedAt: now
    };
  }
  function cloneList(list) {
    if (!list || typeof list !== 'object' || !list.id || !Array.isArray(list.columns) || !Array.isArray(list.items)) throw new Error('A valid list is required.');
    return { ...list, columns: list.columns.map(column => ({ ...column, options: column.options ? column.options.slice() : undefined })), items: list.items.map(item => ({ ...item, values: { ...item.values } })) };
  }
  function touch(list, options = {}) { list.updatedAt = stamp(options.now); return list; }
  function renameList(list, title, options = {}) {
    const next = cloneList(list); next.title = requiredName(title, 'list name'); return touch(next, options);
  }
  function addColumn(list, input = {}, options = {}) {
    const next = cloneList(list);
    const name = requiredName(input.name, 'column name');
    if (next.columns.some(column => column.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error('A column with that name already exists.');
    const type = input.type || 'text';
    if (!types.has(type)) throw new Error('Choose a supported column type: text, date or choice.');
    const column = { id: options.id || makeId('column'), name, type, required: input.required === true, builtIn: false };
    if (type === 'choice') {
      const choices = Array.isArray(input.options) ? input.options.map(value => String(value).trim()).filter(Boolean) : [];
      if (!choices.length || choices.length > 30) throw new Error('A choice column needs between 1 and 30 options.');
      column.options = [...new Set(choices)];
    }
    next.columns.push(column);
    return touch(next, options);
  }
  function renameColumn(list, columnId, name, options = {}) {
    const next = cloneList(list);
    const column = next.columns.find(item => item.id === columnId);
    if (!column) throw new Error('Column not found.');
    const nextName = requiredName(name, 'column name');
    if (next.columns.some(item => item.id !== columnId && item.name.toLocaleLowerCase() === nextName.toLocaleLowerCase())) throw new Error('A column with that name already exists.');
    column.name = nextName;
    return touch(next, options);
  }
  function deleteColumn(list, columnId, options = {}) {
    const next = cloneList(list);
    const column = next.columns.find(item => item.id === columnId);
    if (!column) throw new Error('Column not found.');
    if (column.builtIn) throw new Error('Built-in columns cannot be deleted.');
    next.columns = next.columns.filter(item => item.id !== columnId);
    next.items.forEach(item => { delete item.values[columnId]; });
    return touch(next, options);
  }
  function normalizeValues(list, input = {}, previous = {}) {
    const supplied = input.values && typeof input.values === 'object' ? input.values : {};
    const values = { ...previous };
    for (const column of list.columns) {
      if (!Object.prototype.hasOwnProperty.call(supplied, column.id)) continue;
      let value = supplied[column.id];
      if (column.type === 'date') value = dueDate(value);
      else value = String(value ?? '').trim();
      if (column.id === 'title' && !value) throw new Error('A record title is required.');
      if (column.id === 'status' && value && !statuses.includes(value)) throw new Error('Choose a supported status.');
      if (column.id === 'priority' && value && !priorities.includes(value)) throw new Error('Choose a supported priority.');
      if (column.type === 'choice' && value && !column.options.includes(value)) throw new Error(`Choose a valid value for ${column.name}.`);
      if (column.required && !value) throw new Error(`${column.name} is required.`);
      values[column.id] = value;
    }
    if (!Object.prototype.hasOwnProperty.call(values, 'title') || !String(values.title || '').trim()) throw new Error('A record title is required.');
    for (const column of list.columns) if (!Object.prototype.hasOwnProperty.call(values, column.id)) values[column.id] = column.id === 'status' ? 'Not started' : column.id === 'priority' ? 'Normal' : '';
    return values;
  }
  function addItem(list, input = {}, options = {}) {
    const next = cloneList(list);
    const now = stamp(options.now);
    next.items.push({ id: options.id || makeId('record'), values: normalizeValues(next, input), createdAt: now, updatedAt: now });
    return touch(next, { now });
  }
  function updateItem(list, itemId, patch = {}, options = {}) {
    const next = cloneList(list);
    const item = next.items.find(record => record.id === itemId);
    if (!item) throw new Error('Record not found.');
    item.values = normalizeValues(next, patch, item.values);
    item.updatedAt = stamp(options.now);
    return touch(next, options);
  }
  function deleteItem(list, itemId, options = {}) {
    const next = cloneList(list);
    next.items = next.items.filter(item => item.id !== itemId);
    return touch(next, options);
  }
  function filterItems(list, options = {}) {
    const query = String(options.query || '').trim().toLocaleLowerCase();
    const status = options.status || '';
    return list.items.filter(item => {
      if (status && item.values.status !== status) return false;
      if (!query) return true;
      return list.columns.some(column => String(item.values[column.id] ?? '').toLocaleLowerCase().includes(query));
    });
  }
  function sortItems(items, columnId, direction = 'asc') {
    const sign = direction === 'desc' ? -1 : 1;
    const priorityOrder = { low: 0, normal: 1, high: 2 };
    return items.slice().sort((a, b) => {
      const leftValue = String(a.values[columnId] ?? '');
      const rightValue = String(b.values[columnId] ?? '');
      if (columnId === 'priority') {
        const leftRank = priorityOrder[leftValue.toLocaleLowerCase()] ?? 99;
        const rightRank = priorityOrder[rightValue.toLocaleLowerCase()] ?? 99;
        return (leftRank - rightRank) * sign;
      }
      return leftValue.toLocaleLowerCase().localeCompare(rightValue.toLocaleLowerCase(), undefined, { numeric: true }) * sign;
    });
  }

  const service = { createList, renameList, addColumn, renameColumn, deleteColumn, addItem, updateItem, deleteItem, filterItems, sortItems, statuses: statuses.slice(), priorities: priorities.slice() };
  root.BrightdeskListsService = service;
  if (typeof module !== 'undefined' && module.exports) module.exports = service;
})(typeof globalThis !== 'undefined' ? globalThis : window);
