import { describe, expect, it } from "vitest";

import type { FormTexts } from "./types";

import {
  getBannerText,
  getFieldOptionLabels,
  getGroupLabel,
} from "./textsResolver";

const texts: FormTexts = {
  "banners.info.text": "Info banner",
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

describe("getBannerText", () => {
  it("returns undefined when a banner translation is missing", () => {
    expect(getBannerText(texts, "banners.missing")).toBeUndefined();
  });
});
