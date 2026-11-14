export class PrintingError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "PrintingError";
    this.code = code;
  }
}
