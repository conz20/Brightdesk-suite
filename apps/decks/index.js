import { theme, Button, Card } from "@brightdesk/ui";
const state = {
  slide: Card({ title: "Brightdesk Decks", content: "Presentation Builder" }),
  presentButton: Button({ label: "Start Presentation", variant: "primary" })
};
console.log("Brightdesk Decks — Components loaded:", state);
