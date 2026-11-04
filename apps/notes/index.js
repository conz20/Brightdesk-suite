import { theme, Card, Input } from "@brightdesk/ui";
const state = {
  noteCard: Card({ title: "Quick Note", content: "Meeting notes and ideas" }),
  searchInput: Input({ placeholder: "Search notes..." })
};
console.log("Brightdesk Notes — Components loaded:", state);
