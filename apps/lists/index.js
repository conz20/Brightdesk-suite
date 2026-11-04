import { theme, Button, Card } from "@brightdesk/ui";
const state = {
  listCard: Card({ title: "Brightdesk Lists", content: "Smart Lists & Collections" }),
  addItemButton: Button({ label: "Add Item", variant: "primary" })
};
console.log("Brightdesk Lists — Components loaded:", state);
