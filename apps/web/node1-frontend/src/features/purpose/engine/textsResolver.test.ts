import { describe, expect, it } from "vitest";

import type { FormTexts } from "./types";

import {
  getFieldOptionLabels,
  getGroupLabel,
  mergeTexts,
} from "./textsResolver";

const texts: FormTexts = {
  "groups.section.label": "Section",
  "purpose.INSTITUTIONAL": "Institutional purpose",
  "purpose.label": "Purpose",
  "purpose.placeholder": "Should not be treated as an option",
};

describe("getFieldOptionLabels", () => {
  it("resolves only labels for option values declared in the schema", () => {
    expect(
      getFieldOptionLabels(texts, "purpose", ["INSTITUTIONAL", "OTHER"]),
    ).toEqual({
      INSTITUTIONAL: "Institutional purpose",
    });
  });
});

describe("getGroupLabel", () => {
  it("returns undefined when a group translation is missing", () => {
    expect(getGroupLabel(texts, "groups.missing")).toBeUndefined();
  });
});

describe("mergeTexts", () => {
  it("shallow-merges disjoint legal and UI dictionaries", () => {
    expect(
      mergeTexts(
        { "purpose.label": "Purpose" },
        { "purpose.error.required": "Required" },
      ),
    ).toEqual({
      "purpose.error.required": "Required",
      "purpose.label": "Purpose",
    });
  });

  it("throws when keys collide across the two dictionaries", () => {
    expect(() =>
      mergeTexts({ "purpose.label": "A" }, { "purpose.label": "B" }),
    ).toThrow(/Duplicate text keys/);
  });
});
