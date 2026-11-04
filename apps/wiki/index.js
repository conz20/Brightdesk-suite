import { theme, Card, Input } from "@brightdesk/ui";
const state = {
  wikiPage: Card({ title: "Brightdesk Wiki", content: "Knowledge Base Article" }),
  searchInput: Input({ placeholder: "Search documentation..." })
};
console.log("Brightdesk Wiki — Components loaded:", state);
