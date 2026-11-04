import { theme, Button, Card } from "@brightdesk/ui";

const app = document.getElementById("app");
app.style.backgroundColor = theme.colors.background;
app.style.color = theme.colors.text;
app.style.fontFamily = theme.typography.fontFamily;
app.style.padding = "24px";

const headerProps = Card({ title: "Brightdesk Database", content: "Relational Workspace & Data Schemas" });
const header = document.createElement("div");
header.innerText = `${headerProps.title} — ${headerProps.content}`;
Object.assign(header.style, headerProps.style);
app.appendChild(header);

const queryBtnProps = Button({ label: "Run SQL Query", variant: "primary" });
const queryBtn = document.createElement("button");
queryBtn.innerText = queryBtnProps.label;
Object.assign(queryBtn.style, queryBtnProps.style);
queryBtn.style.marginTop = "16px";
queryBtn.onclick = () => alert("Query executed successfully!");
app.appendChild(queryBtn);
