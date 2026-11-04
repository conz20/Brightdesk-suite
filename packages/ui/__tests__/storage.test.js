import { describe, it, expect, beforeEach } from "vitest";
import { storage } from "../storage.js";

describe("Shared Storage Utility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves JSON objects correctly", () => {
    storage.set("user", { name: "Connor" });
    expect(storage.get("user")).toEqual({ name: "Connor" });
  });

  it("returns null for non-existent keys", () => {
    expect(storage.get("missing")).toBeNull();
  });
});
