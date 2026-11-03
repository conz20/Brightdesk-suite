/*
 * Brightdesk app catalogue — fixed approved product scope.
 * Brightdesk uses original names, code, interface and assets.
 * Microsoft product names below are internal workflow references only.
 * Excluded products must not appear in navigation, catalogue, packaging or installers.
 */
const releaseVersion = typeof window !== 'undefined' && window.brightdesk?.version
  ? window.brightdesk.version
  : require('../package.json').version;

const brightdeskAppCatalog = [
  { id: 'pages', name: 'Brightdesk Pages', subtitle: 'Documents and writing', description: 'Create letters, reports and formatted documents.', icon: 'P', className: 'pages', moduleVersion: releaseVersion, availability: 'available', category: 'Office', microsoftReference: 'Word' },
  { id: 'sheets', name: 'Brightdesk Sheets', subtitle: 'Spreadsheets and data', description: 'Work with tables, calculations, formulas and data.', icon: 'S', className: 'sheets', moduleVersion: releaseVersion, availability: 'available', category: 'Office', microsoftReference: 'Excel' },
  { id: 'slides', name: 'Brightdesk Decks', subtitle: 'Presentations and slides', description: 'Build, design and present slide decks.', icon: 'D', className: 'slides', moduleVersion: releaseVersion, availability: 'available', category: 'Office', microsoftReference: 'PowerPoint' },
  { id: 'notes', name: 'Brightdesk Notes', subtitle: 'Notes and notebooks', description: 'Capture notes, pages, sections, lists and ideas.', icon: 'N', className: 'notes', moduleVersion: releaseVersion, availability: 'available', category: 'Office', microsoftReference: 'OneNote' },
  { id: 'database', name: 'Brightdesk Database', subtitle: 'Tables and databases', description: 'Create local tables, define fields, manage records and export data.', icon: 'DB', className: 'database', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'Access' },
  { id: 'forms', name: 'Brightdesk Forms', subtitle: 'Forms, surveys and quizzes', description: 'Create forms, surveys, quizzes and collect responses locally.', icon: 'F', className: 'forms', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'Forms' },
  { id: 'lists', name: 'Brightdesk Lists', subtitle: 'Structured lists and tracking', description: 'Track projects, inventories, contacts and custom records.', icon: 'L', className: 'lists', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'Lists' },
  { id: 'planner', name: 'Brightdesk Planner', subtitle: 'Plans and tasks', description: 'Organise tasks into plans, buckets, priorities and progress views.', icon: 'PL', className: 'planner', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'Planner' },
  { id: 'todo', name: 'Brightdesk To Do', subtitle: 'Personal tasks', description: 'Manage personal task lists, reminders and daily priorities.', icon: '✓', className: 'todo', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'To Do' },
  { id: 'loop', name: 'Brightdesk Workspace', subtitle: 'Connected project workspaces', description: 'Combine notes, lists, tasks and project material in one local workspace.', icon: '◫', className: 'loop', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'Loop' }
];

if (typeof window !== 'undefined') window.BrightdeskAppCatalog = brightdeskAppCatalog;
if (typeof module !== 'undefined' && module.exports) module.exports = brightdeskAppCatalog;
