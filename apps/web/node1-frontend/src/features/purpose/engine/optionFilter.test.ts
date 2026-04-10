import { describe, expect, it } from "vitest";

import type { ControlElement } from "./types";

import { getFilteredOptionValues } from "./optionFilter";

const radioControl: ControlElement = {
  options: { widget: "radio" },
  scope: "#/properties/someField",
  type: "Control",
};

const controlWithHideOptions: ControlElement = {
  options: {
    hideOptions: {
      PUBLIC_INTEREST_TASK: {
        schema: { contains: { const: "GDPR_ART_9" } },
        scope: "#/properties/personalDataTypes",
      },
    },
    widget: "radio",
  },
  scope: "#/properties/legalBasisPublicInterest",
  type: "Control",
};

describe("getFilteredOptionValues", () => {
  it("returns null when no hideOptions", () => {
    expect(getFilteredOptionValues(radioControl, {})).toBeNull();
  });

  it("hides option when condition is met", () => {
    const hidden = getFilteredOptionValues(controlWithHideOptions, {
      personalDataTypes: ["GDPR_ART_9", "OTHER"],
    });

    expect(hidden).not.toBeNull();
    expect(hidden?.has("PUBLIC_INTEREST_TASK")).toBe(true);
  });

  it("does not hide option when condition is not met", () => {
    const hidden = getFilteredOptionValues(controlWithHideOptions, {
      personalDataTypes: ["OTHER"],
    });

    expect(hidden).toBeNull();
  });
});
