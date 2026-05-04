import { describe, expect, it } from "vitest";

import {
  formatSchemeRefLabels,
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

describe("formatSchemeRefLabels", () => {
  const data = {
    vc_territorial_units: {
      nuts1: "NUTS 1",
      nuts2: "NUTS 2",
      nuts3: "NUTS 3",
    },
  };

  it("formats a disjunction with two refs", () => {
    expect(
      formatSchemeRefLabels(
        [
          { code: "nuts3", scheme: "vc_territorial_units" },
          { code: "nuts2", scheme: "vc_territorial_units" },
        ],
        data,
        { type: "disjunction" },
      ),
    ).toBe("NUTS 3 or NUTS 2");
  });

  it("formats a disjunction with three refs", () => {
    expect(
      formatSchemeRefLabels(
        [
          { code: "nuts3", scheme: "vc_territorial_units" },
          { code: "nuts2", scheme: "vc_territorial_units" },
          { code: "nuts1", scheme: "vc_territorial_units" },
        ],
        data,
        { type: "disjunction" },
      ),
    ).toBe("NUTS 3, NUTS 2 or NUTS 1");
  });

  it("falls back to the code when the ref is unknown", () => {
    expect(
      formatSchemeRefLabels([{ code: "unknown", scheme: "vc_example" }], data),
    ).toBe("unknown");
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
