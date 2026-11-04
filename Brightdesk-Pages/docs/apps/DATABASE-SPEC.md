# Brightdesk Database — implementation specification

## Purpose
Brightdesk Database is a local-first structured data manager. The first release focuses on table design and record management.

## First feature set
- Create, rename and delete tables.
- Add and remove fields with text, number, date, email, web address, checkbox and choice-list types.
- Mark fields as required and validate values.
- Add, edit and delete records.
- Search and sort records.
- Export a table to CSV.
- Save databases locally on the current device.

## Data and privacy
- No online database hosting, account, cloud sync, external service or collaboration in this first version.
- CSV export is supported; database import and SQL query execution are not part of this first version.
- Relationships, query designer, forms and reports are future work; do not claim they are implemented.

## Acceptance checks
1. Create, rename and delete tables without deleting the final table.
2. Add, update and delete fields with correct validation.
3. Create, edit, search, sort and delete records.
4. Preserve data after app restart.
5. Export correct escaped CSV.
6. Keep other Brightdesk app data unchanged.
7. Automated tests pass before Database is marked available.
8. Verify the running Electron app before merge or release.
