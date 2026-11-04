# Brightdesk To Do — implementation specification

## Purpose

Brightdesk To Do is an original, local-first personal task manager. It should feel familiar to people who use modern task-list software while keeping Brightdesk's own name, interface, code and visual identity.

## First complete feature set

- Create tasks with a required title.
- Edit a task title and optional notes.
- Set an optional due date and priority.
- Mark tasks complete and restore them to active.
- Mark and unmark tasks as important.
- Delete tasks with a clear user action.
- Show smart views: My Day, Important, Planned, Tasks and Completed.
- Search task titles and notes.
- Keep tasks saved on the current device between app restarts.
- Show useful empty states and clear save/error feedback.
- Support keyboard use and accessible labels.

## Data and privacy

- Store task data locally in the Brightdesk desktop app.
- Do not add cloud sync, accounts, sharing or external services in this first implementation.
- Do not claim operating-system notifications or recurring reminders until they are implemented and tested.
- Keep task data separate from Pages, Sheets, Decks and Notes data.
- Preserve task data when switching apps or closing and reopening Brightdesk.

## Product integration

- The To Do app must be reachable from the app navigation once it is complete.
- It must have a dedicated task interface, not the generic rich-text editor.
- It must be included in the ten-app catalogue with its original Brightdesk identity.
- Mark it `available` only after its behavior, persistence and regression tests pass.
- Do not change the status of the other five planned apps as part of this work.

## Acceptance checks

1. A user can create a task with a title and see it in Tasks.
2. Empty or whitespace-only task titles are rejected.
3. A task can be edited, completed, restored, marked important and deleted.
4. Smart views show only tasks matching their definition.
5. Search matches task titles and notes without case sensitivity.
6. Due dates and priority survive reloads.
7. Task changes survive app restarts using local storage.
8. Existing four apps continue to work and their saved data is not altered.
9. The app is keyboard accessible and provides labels/status feedback.
10. Automated tests pass before To Do is marked available.
