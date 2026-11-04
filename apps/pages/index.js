import { theme, Button, Card, Input } from "@brightdesk/ui";

const app = document.getElementById("app");
app.style.backgroundColor = theme.colors.background;
app.style.color = theme.colors.text;
app.style.fontFamily = theme.typography.fontFamily;
app.style.padding = "24px";

const headerProps = Card({ title: "Brightdesk Pages", content: "Rich Document Editor" });
const header = document.createElement("div");
header.innerText = `${headerProps.title} — ${headerProps.content}`;
Object.assign(header.style, headerProps.style);
app.appendChild(header);

const titleProps = Input({ placeholder: "Document Title...", value: "Untitled Document" });
const titleInput = document.createElement("input");
titleInput.value = titleProps.value;
titleInput.placeholder = titleProps.placeholder;
Object.assign(titleInput.style, titleProps.style);
titleInput.style.marginTop = "16px";
titleInput.style.display = "block";
app.appendChild(titleInput);

const editor = document.createElement("textarea");
editor.placeholder = "Start writing your document here...";
editor.style.width = "100%";
editor.style.height = "200px";
editor.style.marginTop = "16px";
editor.style.padding = "12px";
editor.style.fontFamily = theme.typography.fontFamily;
app.appendChild(editor);

const saveProps = Button({ label: "Save Document", variant: "primary" });
const saveButton = document.createElement("button");
saveButton.innerText = saveProps.label;
Object.assign(saveButton.style, saveProps.style);
saveButton.style.marginTop = "16px";
saveButton.onclick = () => {
  alert(`Saved "${titleInput.value}" with ${editor.value.length} characters!`);
};
app.appendChild(saveButton);
