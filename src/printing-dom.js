(() => {
  function removeActionColumns(root) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    const tables = [...(root.matches?.("table") ? [root] : []), ...root.querySelectorAll("table")];
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

  window.BrightdeskPrintDom = Object.freeze({ removeActionColumns });
})();
