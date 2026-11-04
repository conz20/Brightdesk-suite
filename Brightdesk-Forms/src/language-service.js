'use strict';

const BUILTIN_LANGUAGES = [
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (Australia)', file: 'en-AU.json', proofingCode: 'en-AU', isDefault: true },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)', file: 'fr-FR.json', proofingCode: 'fr', isDefault: false },
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)', file: 'de-DE.json', proofingCode: 'de', isDefault: false },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', file: 'es-ES.json', proofingCode: 'es', isDefault: false }
];

const BASE_TRANSLATION_KEYS = [
  'sidebar.workspace', 'sidebar.yourApps', 'sidebar.documents', 'sidebar.spreadsheets', 'sidebar.presentations', 'sidebar.quickNotes',
  'sidebar.getApps', 'sidebar.installManage', 'sidebar.languages', 'sidebar.languagePacks', 'sidebar.freeIndependent', 'sidebar.checkUpdates',
  'top.savedOnDevice', 'top.open', 'top.saveProject', 'top.export', 'top.storedLocally',
  'welcome.eyebrow', 'welcome.pagesHeading', 'welcome.pagesDesc', 'welcome.sheetsHeading', 'welcome.sheetsDesc',
  'welcome.slidesHeading', 'welcome.slidesDesc', 'welcome.notesHeading', 'welcome.notesDesc',
  'apps.pages', 'apps.sheets', 'apps.slides', 'apps.notes',
  'apps.pagesSubtitle', 'apps.pagesDescription', 'apps.sheetsSubtitle', 'apps.sheetsDescription', 'apps.slidesSubtitle', 'apps.slidesDescription', 'apps.notesSubtitle', 'apps.notesDescription', 'manager.includeApp', 'language.allInstalled', 'common.words', 'common.zoomIn', 'common.zoomOut',
  'manager.eyebrow', 'manager.chooseTitle', 'manager.manageTitle', 'manager.chooseDesc', 'manager.manageDesc', 'manager.note', 'manager.installSelected', 'manager.done', 'manager.install', 'manager.remove', 'manager.inWorkspace', 'manager.notInstalled',
  'ribbon.home', 'ribbon.insert', 'ribbon.layout', 'ribbon.review', 'ribbon.view', 'ribbon.formulas', 'ribbon.data', 'ribbon.design', 'ribbon.slideShow',
  'language.eyebrow', 'language.title', 'language.description', 'language.displayTitle', 'language.displayDescription', 'language.proofingTitle', 'language.proofingDescription',
  'language.installedTitle', 'language.availableTitle', 'language.installed', 'language.install', 'language.remove', 'language.default', 'language.import', 'language.importHelp',
  'language.restartNotNeeded', 'language.proofingNative', 'language.proofingSupported', 'language.proofingUnavailable', 'language.selectDisplay', 'language.selectProofing', 'language.backToApps', 'language.packImported', 'language.packInstalled', 'language.packRemoved', 'language.importFailed',
  'common.tools', 'common.text', 'common.paragraph', 'common.editing', 'common.proofing', 'common.export', 'common.cells', 'common.cell', 'common.functions', 'common.sort', 'common.slides', 'common.slideContent', 'common.themes', 'common.startPresentation', 'common.note', 'common.zoom', 'common.row', 'common.column', 'common.newRow', 'common.newColumn', 'common.newSlide', 'common.duplicate', 'common.delete', 'common.titleSlide', 'common.textSlide', 'common.fitSlide', 'common.slideCount', 'common.wordCount', 'common.spellCheck', 'common.focusMode', 'common.bold', 'common.italic', 'common.underline', 'common.heading1', 'common.heading2', 'common.bullets', 'common.numbering', 'common.quote', 'common.undo', 'common.redo', 'common.pdf', 'common.table', 'common.horizontalLine', 'common.date', 'common.alignLeft', 'common.centre', 'common.alignRight', 'common.justify', 'common.enterValue', 'common.sortAZ', 'common.sortZA', 'common.fromCurrentSlide', 'common.exportNote', 'common.clearNote', 'common.divider', 'common.checklistItem', 'common.previous', 'common.next', 'common.slideNumber', 'common.of', 'common.startTyping', 'common.notesPlaceholder', 'common.notesHint', 'common.updateChecking', 'common.restartInstall', 'common.saved', 'common.saveFailed'
];

function validateLanguagePack(pack) {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) throw new Error('Language pack must be a JSON object.');
  if (typeof pack.code !== 'string' || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(pack.code)) throw new Error('Language pack code is invalid.');
  if (typeof pack.name !== 'string' || !pack.name.trim() || pack.name.length > 80) throw new Error('Language pack name is invalid.');
  if (typeof pack.nativeName !== 'string' || !pack.nativeName.trim() || pack.nativeName.length > 80) throw new Error('Language pack native name is invalid.');
  if (!['ltr', 'rtl'].includes(pack.direction || 'ltr')) throw new Error('Language pack text direction is invalid.');
  if (pack.proofingCode !== undefined && (typeof pack.proofingCode !== 'string' || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(pack.proofingCode))) throw new Error('Language pack proofing code is invalid.');
  if (!pack.translations || typeof pack.translations !== 'object' || Array.isArray(pack.translations)) throw new Error('Language pack translations are missing.');
  const entries = Object.entries(pack.translations);
  if (entries.length < 10 || entries.length > 1000) throw new Error('Language pack must contain between 10 and 1,000 translation entries.');
  for (const [key, value] of entries) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(key) || key.length > 100 || typeof value !== 'string' || value.length > 1000) throw new Error('Language pack contains an invalid translation entry.');
  }
  return pack;
}

function getBuiltinLanguage(code) {
  return BUILTIN_LANGUAGES.find(language => language.code === code) || null;
}

module.exports = { BUILTIN_LANGUAGES, BASE_TRANSLATION_KEYS, validateLanguagePack, getBuiltinLanguage };
