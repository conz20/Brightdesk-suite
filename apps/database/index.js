import { theme, Button, Card } from "@brightdesk/ui";
const state = {
  header: Card({ title: "Brightdesk Database", content: "Relational Workspace" }),
  queryButton: Button({ label: "Run Query", variant: "primary" })
};
console.log("Brightdesk Database — Components loaded:", state);
