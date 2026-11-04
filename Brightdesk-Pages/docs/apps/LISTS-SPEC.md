# Brightdesk Lists — implementation specification

## Purpose
Brightdesk Lists is an original, local-first structured record manager. It is designed for tracking projects, inventory, contacts and other repeatable information while keeping Brightdesk's own code, interface and identity.

## First feature set
- Create, rename and delete separate lists.
- Create records with a required title, status, priority, due date and notes.
- Edit and delete individual records.
- Add custom text, date and choice columns.
- Search records across their fields.
- Filter by status and sort by a selected column.
- Save list data locally on the current device.
- Keep lists separate from Pages, Sheets, Decks and Notes data.

## Data and privacy
- No account, cloud sync, external service or sharing in this first version.
- List data is stored in the Brightdesk local document store.
- Do not claim collaborative editing, attachments, permissions, automation or online forms.

## Acceptance checks
1. Create, rename and delete a list without affecting other lists.
2. Add, edit and delete records.
3. Reject blank list and record titles and invalid dates or choice values.
4. Add custom text, date and choice columns and preserve record values.
5. Search, filter and sort records.
6. Persist changes after app restart.
7. Keep the existing four core apps' data unchanged.
8. Automated tests pass before the catalogue marks Lists available.
9. Verify the running Electron app before merging or publishing.
