import { theme, Button, Card } from "@brightdesk/ui";
const state = {
  board: Card({ title: "Brightdesk Planner", content: "Project Timeline & Kanban" }),
  newSprintButton: Button({ label: "New Sprint", variant: "primary" })
};
console.log("Brightdesk Planner — Components loaded:", state);
