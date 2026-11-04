import { theme, Button, Card, Input } from "@brightdesk/ui";
const state = {
  header: Card({ title: "Brightdesk Sheets", content: "Spreadsheet & Data Grid" }),
  formulaBar: Input({ placeholder: "Enter formula...", value: "=SUM(A1:A10)" }),
  exportButton: Button({ label: "Export CSV", variant: "primary" })
};
console.log("Brightdesk Sheets — Components loaded:", state);
