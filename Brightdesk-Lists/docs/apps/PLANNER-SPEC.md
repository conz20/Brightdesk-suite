# Brightdesk Planner — implementation specification

## Purpose
Brightdesk Planner is a local-first project board for organising work into plans, buckets and tasks.

## First feature set
- Create and rename plans.
- Create, rename and delete buckets.
- Move tasks when a bucket is removed.
- Create, edit and delete tasks.
- Track task title, description, bucket, priority, progress, due date, assignee text and labels.
- Filter tasks by search, progress, priority and bucket.
- Save plans locally on the current device.

## Data and privacy
- No online collaboration, account, cloud sync, external service or notifications in this first version.
- Assignee is a local text field, not a connected user directory.
- Do not claim automatic task assignment, reminders, recurring tasks or shared plans.

## Acceptance checks
1. Create and rename plans.
2. Create, rename and delete buckets without losing their tasks.
3. Create, edit, move, filter and delete tasks.
4. Validate required titles, dates, priorities and progress.
5. Preserve plans after app restart.
6. Keep other Brightdesk app data unchanged.
7. Automated tests pass before Planner is marked available.
8. Verify the running Electron app before merge or release.
