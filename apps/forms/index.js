import { theme, Button, Card, Input } from "@brightdesk/ui";
const state = {
  formHeader: Card({ title: "Brightdesk Forms", content: "Form Builder" }),
  fieldInput: Input({ placeholder: "Enter question..." }),
  submitButton: Button({ label: "Submit Form", variant: "primary" })
};
console.log("Brightdesk Forms — Components loaded:", state);
