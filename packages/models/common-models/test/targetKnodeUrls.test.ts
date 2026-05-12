import { describe, expect, it } from "vitest";

import { TargetKnodeUrls } from "../src/targetKnodeUrls.ts";

describe("TargetKnodeUrls schema", () => {
  it("parses a valid JSON map with all KnodeId keys and URL values", () => {
    const raw = JSON.stringify({
      Lynx: "https://lynx.knodia.dev",
      Orion: "https://orion.knodia.dev",
    });
    expect(TargetKnodeUrls.parse(raw)).toEqual({
      Lynx: "https://lynx.knodia.dev",
      Orion: "https://orion.knodia.dev",
    });
  });

  it("rejects a JSON map missing a KnodeId", () => {
    const raw = JSON.stringify({ Orion: "https://orion.knodia.dev" });
    expect(() => TargetKnodeUrls.parse(raw)).toThrow();
  });

  it("rejects an empty JSON object", () => {
    expect(() => TargetKnodeUrls.parse("{}")).toThrow();
  });

  it("rejects a non-JSON string", () => {
    expect(() => TargetKnodeUrls.parse("not-json")).toThrow();
  });

  it("rejects unknown knode ids", () => {
    const raw = JSON.stringify({
      Lynx: "https://lynx.knodia.dev",
      Orion: "https://orion.knodia.dev",
      Pippo: "https://pippo.knodia.dev",
    });
    expect(() => TargetKnodeUrls.parse(raw)).toThrow();
  });

  it("rejects invalid URLs", () => {
    const raw = JSON.stringify({
      Lynx: "https://lynx.knodia.dev",
      Orion: "not-a-url",
    });
    expect(() => TargetKnodeUrls.parse(raw)).toThrow();
  });
});
