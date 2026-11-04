import { theme, Button, Card, Input } from "@brightdesk/ui";

const app = document.getElementById("app");
app.style.backgroundColor = theme.colors.background;
app.style.color = theme.colors.text;
app.style.fontFamily = theme.typography.fontFamily;
app.style.padding = "24px";

const title = document.createElement("h1");
title.innerText = "Brightdesk To Do";
app.appendChild(title);

const inputProps = Input({ placeholder: "Add a new task..." });
const input = document.createElement("input");
input.placeholder = inputProps.placeholder;
Object.assign(input.style, inputProps.style);
app.appendChild(input);

const btnProps = Button({ label: "Add Task", variant: "primary" });
const button = document.createElement("button");
button.innerText = btnProps.label;
Object.assign(button.style, btnProps.style);
app.appendChild(button);

button.onclick = () => {
  if (!input.value.trim()) return;
  const cardProps = Card({ title: "Task", content: input.value });
  const card = document.createElement("div");
  card.innerText = `${cardProps.title}: ${cardProps.content}`;
  Object.assign(card.style, cardProps.style);
  card.style.marginTop = "12px";
  app.appendChild(card);
  input.value = "";
};
