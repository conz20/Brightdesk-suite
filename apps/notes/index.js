import { theme, Card, Input } from "@brightdesk/ui";

const app = document.getElementById("app");
app.style.backgroundColor = theme.colors.background;
app.style.color = theme.colors.text;
app.style.fontFamily = theme.typography.fontFamily;
app.style.padding = "24px";

const searchProps = Input({ placeholder: "Search notes..." });
const searchInput = document.createElement("input");
searchInput.placeholder = searchProps.placeholder;
Object.assign(searchInput.style, searchProps.style);
app.appendChild(searchInput);

const noteCard = Card({ title: "Quick Note", content: "Capture ideas, research, and meeting minutes." });
const noteDiv = document.createElement("div");
noteDiv.innerText = `${noteCard.title}\n\n${noteCard.content}`;
Object.assign(noteDiv.style, noteCard.style);
noteDiv.style.marginTop = "16px";
app.appendChild(noteDiv);
