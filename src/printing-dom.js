(() => {
  function cellContainsOnlyActionButtons(cell, buttonSelector) {
    const buttons = Array.from(cell.querySelectorAll(buttonSelector));
    if (!buttons.length) return false;
    return Array.from(cell.childNodes).every((node) => {
      if (node.nodeType === 3) return !node.textContent.trim();
      return node.nodeType === 1 && node.matches(buttonSelector);
    });
  }

  function removeActionColumns(root) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    const selector = "table.lists-table, table.database-data-grid";
    const tables = [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
    tables.forEach((table) => {
      const headerRows = Array.from(table.querySelectorAll("thead tr"));
      const finalHeader = headerRows[headerRows.length - 1];
      if (!finalHeader?.cells.length) return;

      // The generated action column is appended last. A user field may also
      // be named "Actions", so never remove an earlier matching data column.
      const actionIndex = finalHeader.cells.length - 1;
      if (!/^actions?$/i.test(finalHeader.cells[actionIndex].textContent.trim())) return;

      const buttonSelector = table.matches("table.lists-table")
        ? "button.lists-row-action"
        : "button.database-remove";
      const bodyRows = Array.from(table.tBodies).flatMap((body) => Array.from(body.rows));
      const dataRows = bodyRows.filter((row) => !(row.cells.length === 1 && row.cells[0].colSpan > actionIndex));

      // Keep the column unless every populated row proves it contains only
      // Brightdesk's own Edit/Delete controls. This protects customer data.
      if (dataRows.some((row) => !row.cells[actionIndex] || !cellContainsOnlyActionButtons(row.cells[actionIndex], buttonSelector))) {
        return;
      }

      headerRows.forEach((row) => {
        if (row.cells[actionIndex]) row.deleteCell(actionIndex);
      });
      bodyRows.forEach((row) => {
        if (row.cells.length === 1 && row.cells[0].colSpan > actionIndex) {
          row.cells[0].colSpan -= 1;
        } else if (row.cells[actionIndex]) {
          row.deleteCell(actionIndex);
        }
      });
    });
  }

  function createFormsPrintView(source) {
    if (!source || typeof source.querySelector !== "function") return null;
    const app = source.matches?.(".forms-app") ? source : source.querySelector(".forms-app");
    if (!app) return null;
    if (app.querySelector('[data-forms-tab="responses"].active')) return null;
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
          item.textContent = `${type === "choice" ? "○" : "□"} ${option}`;
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
