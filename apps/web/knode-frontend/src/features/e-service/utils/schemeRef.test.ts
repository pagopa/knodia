import { describe, expect, it } from "vitest";

import {
  getSchemeRefLabel,
  parseSchemeRefKeys,
  toSchemeRefKey,
  toSchemeRefOptions,
} from "./schemeRef";

describe("parseSchemeRefKeys", () => {
  it("parses a single key into { scheme, code }", () => {
    expect(parseSchemeRefKeys(["vc_example$nuts1"])).toEqual([
      { code: "nuts1", scheme: "vc_example" },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseSchemeRefKeys([])).toEqual([]);
  });

  it("sets scheme to the full key and code to '' when separator is absent", () => {
    expect(parseSchemeRefKeys(["nope"])).toEqual([
      { code: "", scheme: "nope" },
    ]);
  });

  it("handles numeric keys by coercing them to strings", () => {
    expect(parseSchemeRefKeys([42])).toEqual([{ code: "", scheme: "42" }]);
  });

  it("preserves a '$' inside the code (org name) by splitting on the first separator", () => {
    expect(parseSchemeRefKeys(["Lynx$A & B $ Partners"])).toEqual([
      { code: "A & B $ Partners", scheme: "Lynx" },
    ]);
  });

  it("round-trips an org name containing '$' through toSchemeRefKey", () => {
    const ref = { code: "A & B $ Partners", scheme: "Lynx" };
    const [parsed] = parseSchemeRefKeys([toSchemeRefKey(ref)]);
    expect(parsed).toEqual(ref);
  });
});

describe("toSchemeRefKey", () => {
  it("joins scheme and code with '$'", () => {
    expect(toSchemeRefKey({ code: "nuts1", scheme: "vc_example" })).toBe(
      "vc_example$nuts1",
    );
  });

  it("is the inverse of parseSchemeRefKeys", () => {
    const ref = { code: "bar", scheme: "vc_foo" };
    const [parsed] = parseSchemeRefKeys([toSchemeRefKey(ref)]);
    expect(parsed).toEqual(ref);
  });
});

describe("toSchemeRefOptions", () => {
  it("flattens nested data into { id, label } options", () => {
    const data = { vc_example: { nuts1: "NUTS 1", nuts2: "NUTS 2" } };
    expect(toSchemeRefOptions(data)).toEqual([
      { id: "vc_example$nuts1", label: "NUTS 1" },
      { id: "vc_example$nuts2", label: "NUTS 2" },
    ]);
  });

  it("handles multiple schemes", () => {
    const data = {
      scheme_a: { code1: "Code 1" },
      scheme_b: { code2: "Code 2" },
    };
    const options = toSchemeRefOptions(data);
    expect(options).toHaveLength(2);
    expect(options).toContainEqual({ id: "scheme_a$code1", label: "Code 1" });
    expect(options).toContainEqual({ id: "scheme_b$code2", label: "Code 2" });
  });

  it("returns an empty array for empty data", () => {
    expect(toSchemeRefOptions({})).toEqual([]);
  });
});

describe("getSchemeRefLabel", () => {
  it("uses the readable name for a standard attribute", () => {
    expect(getSchemeRefLabel("knodia$testing_organization")).toBe(
      "Testing Organization",
    );
    expect(getSchemeRefLabel("vc_territorial_units$nuts1")).toBe("NUTS 1");
  });

  it("falls back to the code (the org name) for an org unique attribute", () => {
    // scheme = Knode ID, code = organization name → the label is the org name,
    // derivable from the key alone, so chips survive the dropdown being filtered.
    expect(getSchemeRefLabel("Lynx$Vega 001 Org")).toBe("Vega 001 Org");
    expect(getSchemeRefLabel("Orion$Acme Corp")).toBe("Acme Corp");
  });
});
