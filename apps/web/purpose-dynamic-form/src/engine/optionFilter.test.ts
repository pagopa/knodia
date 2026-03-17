import { describe, expect, it } from "vitest";

import type { ControlElement } from "./types";

import { getFilteredOptionValues } from "./optionFilter";

describe("getFilteredOptionValues", () => {
  it("returns null when no hideOptions", () => {
    const control: ControlElement = {
      options: { widget: "radio" },
      scope: "#/properties/someField",
      type: "Control",
    };

    expect(getFilteredOptionValues(control, {})).toBeNull();
  });

  it("hides option when condition is met", () => {
    const control: ControlElement = {
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

    const hidden = getFilteredOptionValues(control, {
      personalDataTypes: ["GDPR_ART_9", "OTHER"],
    });

    expect(hidden).not.toBeNull();
    expect(hidden?.has("PUBLIC_INTEREST_TASK")).toBe(true);
  });

  it("does not hide option when condition is not met", () => {
    const control: ControlElement = {
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

    const hidden = getFilteredOptionValues(control, {
      personalDataTypes: ["OTHER"],
    });

    expect(hidden).toBeNull();
  });
});
