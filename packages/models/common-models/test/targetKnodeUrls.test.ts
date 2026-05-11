import { describe, expect, it } from "vitest";

import { InternalError } from "../src/errors.ts";
import { getTargetKnodeUrl, TargetKnodeUrls } from "../src/targetKnodeUrls.ts";

describe("TargetKnodeUrls schema", () => {
  it("parses a valid JSON map with KnodeId keys and URL values", () => {
    const raw = JSON.stringify({
      Lynx: "https://lynx.knodia.dev",
      Orion: "https://orion.knodia.dev",
    });
    expect(TargetKnodeUrls.parse(raw)).toEqual({
      Lynx: "https://lynx.knodia.dev",
      Orion: "https://orion.knodia.dev",
    });
  });

  it("parses a JSON map with a single knode", () => {
    const raw = JSON.stringify({ Orion: "https://orion.knodia.dev" });
    expect(TargetKnodeUrls.parse(raw)).toEqual({
      Orion: "https://orion.knodia.dev",
    });
  });

  it("rejects a non-JSON string", () => {
    expect(() => TargetKnodeUrls.parse("not-json")).toThrow();
  });

  it("rejects unknown knode ids", () => {
    const raw = JSON.stringify({ Pippo: "https://pippo.knodia.dev" });
    expect(() => TargetKnodeUrls.parse(raw)).toThrow();
  });

  it("rejects invalid URLs", () => {
    const raw = JSON.stringify({ Orion: "not-a-url" });
    expect(() => TargetKnodeUrls.parse(raw)).toThrow();
  });
});

describe("getTargetKnodeUrl", () => {
  it("returns the URL for a configured target knode", () => {
    const map = TargetKnodeUrls.parse(
      JSON.stringify({ Orion: "https://orion.knodia.dev" }),
    );
    expect(getTargetKnodeUrl(map, "Orion")).toBe("https://orion.knodia.dev");
  });

  it("throws TARGET_KNODE_NOT_CONFIGURED when the target knode is missing from the map", () => {
    const map = TargetKnodeUrls.parse(
      JSON.stringify({ Orion: "https://orion.knodia.dev" }),
    );
    try {
      getTargetKnodeUrl(map, "Lynx");
      expect.fail("Expected getTargetKnodeUrl to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(InternalError);
      expect((e as InternalError<string>).code).toBe(
        "TARGET_KNODE_NOT_CONFIGURED",
      );
    }
  });
});
