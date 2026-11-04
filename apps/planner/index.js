import { theme, Button, Card } from "@brightdesk/ui";

const app = document.getElementById("app");
app.style.backgroundColor = theme.colors.background;
app.style.color = theme.colors.text;
app.style.fontFamily = theme.typography.fontFamily;
app.style.padding = "24px";

const boardCard = Card({ title: "Brightdesk Planner", content: "Project Timeline & Kanban Sprint Board" });
const board = document.createElement("div");
board.innerText = `${boardCard.title}\n\n${boardCard.content}`;
Object.assign(board.style, boardCard.style);
app.appendChild(board);

const sprintProps = Button({ label: "New Sprint", variant: "primary" });
const sprintBtn = document.createElement("button");
sprintBtn.innerText = sprintProps.label;
Object.assign(sprintBtn.style, sprintProps.style);
sprintBtn.style.marginTop = "16px";
sprintBtn.onclick = () => alert("New sprint created!");
app.appendChild(sprintBtn);
