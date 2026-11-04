import { theme, Button, Card } from "@brightdesk/ui";

const app = document.getElementById("app");
app.style.backgroundColor = theme.colors.background;
app.style.color = theme.colors.text;
app.style.fontFamily = theme.typography.fontFamily;
app.style.padding = "24px";

const cardProps = Card({ title: "Smart Lists", content: "Organize items, inventory, or custom data collections." });
const card = document.createElement("div");
card.innerText = `${cardProps.title}\n\n${cardProps.content}`;
Object.assign(card.style, cardProps.style);
app.appendChild(card);

const addProps = Button({ label: "Add Item", variant: "primary" });
const addBtn = document.createElement("button");
addBtn.innerText = addProps.label;
Object.assign(addBtn.style, addProps.style);
addBtn.style.marginTop = "16px";
addBtn.onclick = () => alert("New item added to list!");
app.appendChild(addBtn);
