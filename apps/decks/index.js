import { theme, Button, Card } from "@brightdesk/ui";

const app = document.getElementById("app");
app.style.backgroundColor = theme.colors.background;
app.style.color = theme.colors.text;
app.style.fontFamily = theme.typography.fontFamily;
app.style.padding = "24px";

const cardProps = Card({ title: "Slide 1: Welcome", content: "Brightdesk Decks Presentation Builder" });
const card = document.createElement("div");
card.innerText = `${cardProps.title}\n\n${cardProps.content}`;
Object.assign(card.style, cardProps.style);
card.style.height = "200px";
card.style.display = "flex";
card.style.flexDirection = "column";
card.style.justifyContent = "center";
card.style.alignItems = "center";
app.appendChild(card);

const btnProps = Button({ label: "Start Presentation", variant: "primary" });
const btn = document.createElement("button");
btn.innerText = btnProps.label;
Object.assign(btn.style, btnProps.style);
btn.style.marginTop = "16px";
btn.onclick = () => alert("Launching presentation mode...");
app.appendChild(btn);
