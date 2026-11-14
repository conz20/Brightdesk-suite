(() => {
  function removeActionColumns(root) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    const selector = "table.lists-table, table.database-data-grid";
    const tables = [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
    tables.forEach((table) => {
      const headerRows = Array.from(table.querySelectorAll("thead tr"));
      const actionIndexes = new Set();
      headerRows.forEach((row) => {
        Array.from(row.cells).forEach((cell, index) => {
          if (/^actions?$/i.test(cell.textContent.trim())) actionIndexes.add(index);
        });
      });
      if (!actionIndexes.size) return;
      Array.from(table.rows).forEach((row) => {
        Array.from(actionIndexes).sort((a, b) => b - a).forEach((index) => {
          if (row.cells.length === 1 && row.cells[0].colSpan > 1) {
            row.cells[0].colSpan -= 1;
          } else if (row.cells[index]) {
            row.deleteCell(index);
          }
        });
      });
    });
  }

  function createFormsPrintView(source) {
    if (!source || typeof source.querySelector !== "function") return null;
    const app = source.matches?.(".forms-app") ? source : source.querySelector(".forms-app");
    if (!app) return null;
    const doc = app.ownerDocument;
    const view = doc.createElement("section");
    view.className = "brightdesk-print-form";

    const title = doc.createElement("h2");
    title.textContent = app.querySelector("#forms-title")?.textContent?.trim() || "Form";
    view.append(title);

    const descriptionText = app.querySelector("#forms-description")?.textContent?.trim();
    if (descriptionText) {
      const description = doc.createElement("p");
      description.className = "brightdesk-print-form-description";
      description.textContent = descriptionText;
      view.append(description);
    }

    const cards = Array.from(app.querySelectorAll(".forms-question-card"));
    if (!cards.length) {
      const empty = doc.createElement("p");
      empty.textContent = "No questions have been added yet.";
      view.append(empty);
      return view;
    }

    const questions = doc.createElement("ol");
    questions.className = "brightdesk-print-questions";
    cards.forEach((card, index) => {
      const question = doc.createElement("li");
      question.className = "brightdesk-print-question";
      const labelText = card.querySelector('input[name="label"]')?.value?.trim() || "Untitled question";
      const type = card.querySelector('select[name="type"]')?.value || "short-text";
      const required = Boolean(card.querySelector('input[name="required"]')?.checked);

      const heading = doc.createElement("h3");
      heading.textContent = `${index + 1}. ${labelText}${required ? " *" : ""}`;
      question.append(heading);

      if (required) {
        const requiredNote = doc.createElement("p");
        requiredNote.className = "brightdesk-print-required";
        requiredNote.textContent = "* Required";
        question.append(requiredNote);
      }

      if (type === "choice" || type === "multi-choice") {
        const optionsText = card.querySelector('input[name="options"]')?.value || "";
        const options = optionsText.split(",").map((option) => option.trim()).filter(Boolean);
        const list = doc.createElement("ul");
        list.className = "brightdesk-print-answer-options";
        options.forEach((option) => {
          const item = doc.createElement("li");
          item.textContent = `□ ${option}`;
          list.append(item);
        });
        if (!options.length) {
          const item = doc.createElement("li");
          item.textContent = "No answer choices configured.";
          list.append(item);
        }
        question.append(list);
      } else {
        const answer = doc.createElement("div");
        answer.className = type === "long-text"
          ? "brightdesk-print-answer-space"
          : "brightdesk-print-answer-line";
        answer.setAttribute("aria-hidden", "true");
        question.append(answer);
      }

      questions.append(question);
    });
    view.append(questions);
    return view;
  }

  window.BrightdeskPrintDom = Object.freeze({ removeActionColumns, createFormsPrintView });
})();
