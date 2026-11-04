import { theme, Button, Card, Input } from "@brightdesk/ui";

const app = document.getElementById("app");
app.style.backgroundColor = theme.colors.background;
app.style.color = theme.colors.text;
app.style.fontFamily = theme.typography.fontFamily;
app.style.padding = "24px";

const headerProps = Card({ title: "Brightdesk Forms", content: "Form Builder & Response Collector" });
const header = document.createElement("div");
header.innerText = `${headerProps.title} — ${headerProps.content}`;
Object.assign(header.style, headerProps.style);
app.appendChild(header);

const fieldProps = Input({ placeholder: "Question title..." });
const fieldInput = document.createElement("input");
fieldInput.placeholder = fieldProps.placeholder;
Object.assign(fieldInput.style, fieldProps.style);
fieldInput.style.marginTop = "16px";
fieldInput.style.display = "block";
app.appendChild(fieldInput);

const submitProps = Button({ label: "Submit Form", variant: "primary" });
const submitBtn = document.createElement("button");
submitBtn.innerText = submitProps.label;
Object.assign(submitBtn.style, submitProps.style);
submitBtn.style.marginTop = "16px";
submitBtn.onclick = () => alert("Form submission recorded!");
app.appendChild(submitBtn);
