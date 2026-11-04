import { theme, Button, Card, Input } from "@brightdesk/ui";

const documentState = {
  header: Card({ title: "Brightdesk Pages", content: "Rich Document Editor" }),
  titleInput: Input({ placeholder: "Document Title...", value: "Project Proposal" }),
  saveButton: Button({ label: "Save Document", variant: "primary" }),
  theme: theme.colors.primary
};

console.log("Brightdesk Pages — Component integration initialized:");
console.log(documentState);
