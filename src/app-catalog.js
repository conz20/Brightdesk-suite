/*
 * Brightdesk app catalogue — fixed approved product scope.
 * Brightdesk uses original names, code, interface and assets.
 * Microsoft product names below are internal workflow references only.
 * Excluded products must not appear in navigation, catalogue, packaging or installers.
 */
const brightdeskAppCatalog = [
  { id: 'pages', name: 'Brightdesk Pages', subtitle: 'Documents and writing', description: 'Create letters, reports and formatted documents.', icon: 'assets/app-icons/pages.svg', className: 'pages', moduleVersion: '0.1.0', availability: 'available', category: 'Office', microsoftReference: 'Word' },
  { id: 'sheets', name: 'Brightdesk Sheets', subtitle: 'Spreadsheets and data', description: 'Work with tables, calculations, formulas and data.', icon: 'assets/app-icons/sheets.svg', className: 'sheets', moduleVersion: '0.1.0', availability: 'available', category: 'Office', microsoftReference: 'Excel' },
  { id: 'slides', name: 'Brightdesk Decks', subtitle: 'Presentations and slides', description: 'Build, design and present slide decks.', icon: 'assets/app-icons/slides.svg', className: 'slides', moduleVersion: '0.1.0', availability: 'available', category: 'Office', microsoftReference: 'PowerPoint' },
  { id: 'notes', name: 'Brightdesk Notes', subtitle: 'Notes and notebooks', description: 'Capture notes, pages, sections, lists and ideas.', icon: 'assets/app-icons/notes.svg', className: 'notes', moduleVersion: '0.1.0', availability: 'available', category: 'Office', microsoftReference: 'OneNote' },
  { id: 'database', name: 'Brightdesk Database', subtitle: 'Tables and databases', description: 'Create local tables, define fields, manage records and export data.', icon: 'assets/app-icons/database.svg', className: 'database', moduleVersion: '0.1.0', availability: 'available', category: 'Productivity', microsoftReference: 'Access' },
  { id: 'forms', name: 'Brightdesk Forms', subtitle: 'Forms, surveys and quizzes', description: 'Create forms, surveys, quizzes and collect responses locally.', icon: 'assets/app-icons/forms.svg', className: 'forms', moduleVersion: '0.1.0', availability: 'available', category: 'Productivity', microsoftReference: 'Forms' },
  { id: 'lists', name: 'Brightdesk Lists', subtitle: 'Structured lists and tracking', description: 'Track projects, inventories, contacts and custom records.', icon: 'assets/app-icons/lists.svg', className: 'lists', moduleVersion: '0.1.0', availability: 'available', category: 'Productivity', microsoftReference: 'Lists' },
  { id: 'planner', name: 'Brightdesk Planner', subtitle: 'Plans and tasks', description: 'Organise tasks into plans, buckets, priorities and progress views.', icon: 'assets/app-icons/planner.svg', className: 'planner', moduleVersion: '0.1.0', availability: 'available', category: 'Productivity', microsoftReference: 'Planner' },
  { id: 'todo', name: 'Brightdesk To Do', subtitle: 'Personal tasks', description: 'Manage personal task lists, reminders and daily priorities.', icon: 'assets/app-icons/todo.svg', className: 'todo', moduleVersion: '0.1.0', availability: 'available', category: 'Productivity', microsoftReference: 'To Do' },
  { id: 'loop', name: 'Brightdesk Workspace', subtitle: 'Connected project workspaces', description: 'Combine notes, lists, tasks and project material in one local workspace.', icon: 'assets/app-icons/loop.svg', className: 'loop', moduleVersion: '0.1.0', availability: 'available', category: 'Productivity', microsoftReference: 'Loop' }
];

if (typeof window !== 'undefined') window.BrightdeskAppCatalog = brightdeskAppCatalog;
if (typeof module !== 'undefined' && module.exports) module.exports = brightdeskAppCatalog;
