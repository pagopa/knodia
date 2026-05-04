import { describe, expect, it } from "vitest";

import { getContentType, toHex } from "./file";

describe("getContentType", () => {
  it("returns file.type when present", () => {
    const file = new File(["content"], "file.txt", { type: "text/plain" });
    expect(getContentType(file)).toBe("text/plain");
  });

  it("infers application/json from .json extension", () => {
    const file = new File(["{}"], "spec.json", { type: "" });
    expect(getContentType(file)).toBe("application/json");
  });

  it("infers application/yaml from .yaml extension", () => {
    const file = new File(["key: value"], "spec.yaml", { type: "" });
    expect(getContentType(file)).toBe("application/yaml");
  });

  it("infers application/yaml from .yml extension", () => {
    const file = new File(["key: value"], "spec.yml", { type: "" });
    expect(getContentType(file)).toBe("application/yaml");
  });

  it("falls back to application/octet-stream for unknown extensions", () => {
    const file = new File(["data"], "binary.bin", { type: "" });
    expect(getContentType(file)).toBe("application/octet-stream");
  });
});

describe("toHex", () => {
  it("converts a Uint8Array to a lowercase hex string", () => {
    expect(toHex(new Uint8Array([0, 1, 15, 16, 255]))).toBe("00010f10ff");
  });

  it("returns an empty string for an empty array", () => {
    expect(toHex(new Uint8Array([]))).toBe("");
  });

  it("produces strings where every byte maps to exactly 2 hex chars", () => {
    const bytes = new Uint8Array(256).map((_, i) => i);
    const hex = toHex(bytes);
    expect(hex).toHaveLength(512);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });
});
