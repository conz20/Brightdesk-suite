import { theme, Button, Card, Input } from "@brightdesk/ui";

const app = document.getElementById("app");
app.style.backgroundColor = theme.colors.background;
app.style.color = theme.colors.text;
app.style.fontFamily = theme.typography.fontFamily;
app.style.padding = "24px";

const headerProps = Card({ title: "Brightdesk Sheets", content: "Spreadsheet & Data Grid" });
const header = document.createElement("div");
header.innerText = `${headerProps.title} — ${headerProps.content}`;
Object.assign(header.style, headerProps.style);
app.appendChild(header);

const formulaProps = Input({ placeholder: "Formula bar: e.g. =SUM(A1:A5)", value: "=SUM(A1:A3)" });
const formulaInput = document.createElement("input");
formulaInput.value = formulaProps.value;
formulaInput.placeholder = formulaProps.placeholder;
Object.assign(formulaInput.style, formulaProps.style);
formulaInput.style.marginTop = "16px";
formulaInput.style.width = "100%";
app.appendChild(formulaInput);

const table = document.createElement("table");
table.style.marginTop = "16px";
table.style.borderCollapse = "collapse";
table.style.width = "100%";

for (let r = 0; r < 4; r++) {
  const tr = document.createElement("tr");
  for (let c = 0; c < 4; c++) {
    const td = document.createElement("td");
    const cellInput = document.createElement("input");
    cellInput.value = r === 0 ? `Col ${String.fromCharCode(65 + c)}` : `${r},${c}`;
    cellInput.style.padding = "8px";
    cellInput.style.border = `1px solid ${theme.colors.muted}`;
    cellInput.style.backgroundColor = r === 0 ? theme.colors.surface : theme.colors.background;
    cellInput.style.color = theme.colors.text;
    cellInput.style.fontFamily = theme.typography.fontFamily;
    cellInput.style.width = "100%";
    td.appendChild(cellInput);
    tr.appendChild(td);
  }
  table.appendChild(tr);
}
app.appendChild(table);

const btnProps = Button({ label: "Export CSV", variant: "primary" });
const exportButton = document.createElement("button");
exportButton.innerText = btnProps.label;
Object.assign(exportButton.style, btnProps.style);
exportButton.style.marginTop = "16px";
exportButton.onclick = () => {
  alert("Sheet exported to CSV successfully!");
};
app.appendChild(exportButton);
