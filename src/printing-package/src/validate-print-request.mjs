import { PrintingError } from "./printing-error.mjs";

const PAPER_SIZES = new Set([
  "A3",
  "A4",
  "A5",
  "A6",
  "Legal",
  "Letter",
  "Tabloid",
]);

const DUPLEX_MODES = new Set(["simplex", "shortEdge", "longEdge"]);
const ORIENTATIONS = new Set(["portrait", "landscape"]);
const MARGIN_TYPES = new Set(["default", "none", "printableArea", "custom"]);

function invalid(message) {
  throw new PrintingError("INVALID_PRINT_REQUEST", message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateMargins(margins) {
  if (margins === undefined) return undefined;
  if (!isRecord(margins) || !MARGIN_TYPES.has(margins.marginType)) {
    invalid("margins must use default, none, printableArea, or custom.");
  }

  if (margins.marginType !== "custom") {
    return { marginType: margins.marginType };
  }

  const sides = ["top", "bottom", "left", "right"];
  const result = { marginType: "custom" };
  for (const side of sides) {
    const value = margins[side];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      invalid(`custom margins.${side} must be a finite, non-negative pixel value.`);
    }
    result[side] = value;
  }
  return result;
}

function validatePageRanges(pageRanges) {
  if (pageRanges === undefined) return undefined;
  if (!Array.isArray(pageRanges) || pageRanges.length < 1 || pageRanges.length > 100) {
    invalid("pageRanges must contain between 1 and 100 ranges.");
  }

  return pageRanges.map((range, index) => {
    if (!isRecord(range)
      || !Number.isInteger(range.from)
      || !Number.isInteger(range.to)
      || range.from < 0
      || range.to < range.from) {
      invalid(`pageRanges[${index}] must have non-negative integer from/to values with from <= to.`);
    }
    return { from: range.from, to: range.to };
  });
}

export function normalizePrintRequest(input) {
  if (!isRecord(input)) {
    invalid("A print request object is required.");
  }

  const orientation = input.orientation ?? "portrait";
  if (!ORIENTATIONS.has(orientation)) {
    invalid("orientation must be portrait or landscape.");
  }

  const color = input.color ?? true;
  if (typeof color !== "boolean") {
    invalid("color must be a boolean.");
  }

  const duplex = input.duplex ?? "simplex";
  if (!DUPLEX_MODES.has(duplex)) {
    invalid("duplex must be simplex, shortEdge, or longEdge.");
  }

  const copies = input.copies ?? 1;
  if (!Number.isInteger(copies) || copies < 1 || copies > 999) {
    invalid("copies must be a whole number from 1 to 999.");
  }

  const printBackground = input.printBackground ?? false;
  if (typeof printBackground !== "boolean") {
    invalid("printBackground must be a boolean.");
  }

  let printerName;
  if (input.printerName !== undefined) {
    if (typeof input.printerName !== "string" || input.printerName.trim() === "") {
      invalid("printerName must be a non-empty system printer name.");
    }
    printerName = input.printerName.trim();
  }

  let pageSize;
  if (input.pageSize !== undefined) {
    if (typeof input.pageSize !== "string" || !PAPER_SIZES.has(input.pageSize)) {
      invalid("pageSize must be a supported standard paper size.");
    }
    pageSize = input.pageSize;
  }

  const normalized = {
    orientation,
    color,
    duplex,
    copies,
    printBackground,
  };

  if (printerName !== undefined) normalized.printerName = printerName;
  if (pageSize !== undefined) normalized.pageSize = pageSize;

  const pageRanges = validatePageRanges(input.pageRanges);
  if (pageRanges !== undefined) normalized.pageRanges = pageRanges;

  const margins = validateMargins(input.margins);
  if (margins !== undefined) normalized.margins = margins;

  return normalized;
}
