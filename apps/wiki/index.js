import { theme, Card, Input } from "@brightdesk/ui";

const app = document.getElementById("app");
app.style.backgroundColor = theme.colors.background;
app.style.color = theme.colors.text;
app.style.fontFamily = theme.typography.fontFamily;
app.style.padding = "24px";

const searchProps = Input({ placeholder: "Search documentation..." });
const searchInput = document.createElement("input");
searchInput.placeholder = searchProps.placeholder;
Object.assign(searchInput.style, searchProps.style);
app.appendChild(searchInput);

const wikiCard = Card({ title: "Knowledge Base", content: "Company guidelines, docs, and architecture specs." });
const wikiDiv = document.createElement("div");
wikiDiv.innerText = `${wikiCard.title}\n\n${wikiCard.content}`;
Object.assign(wikiDiv.style, wikiCard.style);
wikiDiv.style.marginTop = "16px";
app.appendChild(wikiDiv);
