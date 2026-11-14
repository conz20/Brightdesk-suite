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
  { id: 'pages', name: 'Brightdesk Pages', subtitle: 'Documents & writing', description: 'Create letters, reports and formatted documents.', iconAsset: 'pages.svg', className: 'pages', moduleVersion: releaseVersion, availability: 'available', category: 'Office', microsoftReference: 'Word' },
  { id: 'sheets', name: 'Brightdesk Sheets', subtitle: 'Spreadsheets & formulas', description: 'Work with tables, calculations, formulas and data.', iconAsset: 'sheets.svg', className: 'sheets', moduleVersion: releaseVersion, availability: 'available', category: 'Office', microsoftReference: 'Excel' },
  { id: 'slides', name: 'Brightdesk Decks', subtitle: 'Presentations & slides', description: 'Build, design and present slide decks.', iconAsset: 'decks.svg', className: 'slides', moduleVersion: releaseVersion, availability: 'available', category: 'Office', microsoftReference: 'PowerPoint' },
  { id: 'notes', name: 'Brightdesk Notes', subtitle: 'Notes & ideas', description: 'Capture notes, pages, sections, lists and ideas.', iconAsset: 'notes.svg', className: 'notes', moduleVersion: releaseVersion, availability: 'available', category: 'Office', microsoftReference: 'OneNote' },
  { id: 'database', name: 'Brightdesk Database', subtitle: 'Tables & structured records', description: 'Create local tables, define fields, manage records and export data.', iconAsset: 'database.svg', className: 'database', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'Access' },
  { id: 'forms', name: 'Brightdesk Forms', subtitle: 'Forms, surveys & quizzes', description: 'Create forms, surveys, quizzes and collect responses locally.', iconAsset: 'forms.svg', className: 'forms', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'Forms' },
  { id: 'lists', name: 'Brightdesk Lists', subtitle: 'Lists & tracking', description: 'Track projects, inventories, contacts and custom records.', iconAsset: 'lists.svg', className: 'lists', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'Lists' },
  { id: 'planner', name: 'Brightdesk Planner', subtitle: 'Projects & planning', description: 'Organise tasks into plans, buckets, priorities and progress views.', iconAsset: 'planner.svg', className: 'planner', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'Planner' },
  { id: 'todo', name: 'Brightdesk To Do', subtitle: 'Daily tasks & reminders', description: 'Manage personal tasks, due dates and daily priorities.', iconAsset: 'to-do.svg', className: 'todo', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'To Do' },
  { id: 'loop', name: 'Brightdesk Workspace', subtitle: 'Your connected workspace', description: 'Bring notes, checklists and project material together in one local workspace.', iconAsset: 'workspace.svg', className: 'loop', moduleVersion: releaseVersion, availability: 'available', category: 'Productivity', microsoftReference: 'Loop' }
];

if (typeof window !== 'undefined') window.BrightdeskAppCatalog = brightdeskAppCatalog;
if (typeof module !== 'undefined' && module.exports) module.exports = brightdeskAppCatalog;
