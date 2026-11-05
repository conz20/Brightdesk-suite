'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.children = [];
    this.listeners = new Map();
    this.hidden = false;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
  }

  append(...children) { this.children.push(...children); }
  addEventListener(type, callback) {
    const callbacks = this.listeners.get(type) || [];
    callbacks.push(callback);
    this.listeners.set(type, callbacks);
  }
  reset() { this.value = ''; }
  dispatch(type, event = {}) {
    for (const callback of this.listeners.get(type) || []) callback(event);
  }
}

test('Planner explains when the local save operation fails', () => {
  const root = path.join(__dirname, '..');
  const source = fs.readFileSync(path.join(root, 'src', 'planner-workspace.js'), 'utf8');
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    },
    createElement(tagName) { return new FakeElement(tagName); }
  };
  const plan = {
    id: 'plan-1',
    title: 'Test plan',
    description: '',
    buckets: [{ id: 'bucket-1', name: 'To do' }],
    tasks: []
  };
  const window = {
    BrightdeskPlannerService: {
      createPlan() { return plan; },
      filterTasks() { return []; }
    }
  };
  const localStorage = {
    getItem() { return '[]'; },
    setItem() { throw new Error('disk full'); }
  };

  vm.runInNewContext(source, { document, window, localStorage });

  elements.get('planner-new-plan').dispatch('submit', {
    preventDefault() {}
  });

  assert.equal(
    elements.get('planner-status').textContent,
    'Could not save Planner data locally: disk full'
  );
});
