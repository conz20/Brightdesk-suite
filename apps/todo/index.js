import { theme, Button, Card, Input } from "@brightdesk/ui";

const state = {
  tasks: [
    Card({ title: "Setup Monorepo", content: "Completed baseline architecture setup." }),
    Card({ title: "Shared Design System", content: "Imported UI components from @brightdesk/ui." })
  ],
  newTaskInput: Input({ placeholder: "Add a new task..." }),
  addButton: Button({ label: "Add Task", variant: "primary" })
};

console.log("Brightdesk To Do — Rendered UI components:");
console.log(state);
