import { describe, expect, it } from "vitest";

import type { ControlElement, UISchema } from "./types";

import { getVisibleFields } from "./dependencyResolver";
import {
  getFilteredOptionValues,
  stripHiddenOptionValues,
  stripHiddenOptionValuesFromAnswers,
} from "./optionFilter";

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

describe("stripHiddenOptionValues", () => {
  const arrayHideControl: ControlElement = {
    options: {
      hideOptions: {
        GDPR_ART_9: {
          schema: { const: "PUBLIC_INTEREST_TASK" },
          scope: "#/properties/legalBasisPublicInterest",
        },
      },
      widget: "checkbox",
    },
    scope: "#/properties/personalDataTypes",
    type: "Control",
  };

  it("removes hidden entries from array values", () => {
    const result = stripHiddenOptionValues(
      ["GDPR_ART_9", "OTHER"],
      arrayHideControl,
      { legalBasisPublicInterest: "PUBLIC_INTEREST_TASK" },
    );
    expect(result).toEqual(["OTHER"]);
  });

  it("returns undefined when a scalar value is hidden", () => {
    const scalarHideControl: ControlElement = {
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
    const result = stripHiddenOptionValues(
      "PUBLIC_INTEREST_TASK",
      scalarHideControl,
      { personalDataTypes: ["GDPR_ART_9"] },
    );
    expect(result).toBeUndefined();
  });

  it("returns the value unchanged when the control has no hideOptions", () => {
    expect(stripHiddenOptionValues("ANY", radioControl, {})).toBe("ANY");
  });
});

describe("stripHiddenOptionValuesFromAnswers", () => {
  const uischema: UISchema = {
    elements: [
      {
        options: {
          hideOptions: {
            GDPR_ART_9: {
              schema: { const: "PUBLIC_INTEREST_TASK" },
              scope: "#/properties/legalBasisPublicInterest",
            },
          },
          widget: "checkbox",
        },
        scope: "#/properties/personalDataTypes",
        type: "Control",
      },
      {
        options: { widget: "radio" },
        scope: "#/properties/legalBasisPublicInterest",
        type: "Control",
      },
    ],
    type: "VerticalLayout",
  };

  it("drops hidden option values from array fields", () => {
    const cleaned = stripHiddenOptionValuesFromAnswers(
      {
        legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
        personalDataTypes: ["GDPR_ART_9", "OTHER"],
      },
      uischema,
    );
    expect(cleaned["personalDataTypes"]).toEqual(["OTHER"]);
    expect(cleaned["legalBasisPublicInterest"]).toBe("PUBLIC_INTEREST_TASK");
  });

  it("omits fields whose scalar value is hidden", () => {
    const scalarUischema: UISchema = {
      elements: [
        {
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
        },
        {
          options: { widget: "checkbox" },
          scope: "#/properties/personalDataTypes",
          type: "Control",
        },
      ],
      type: "VerticalLayout",
    };
    const cleaned = stripHiddenOptionValuesFromAnswers(
      {
        legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
        personalDataTypes: ["GDPR_ART_9"],
      },
      scalarUischema,
    );
    expect(cleaned["legalBasisPublicInterest"]).toBeUndefined();
    expect(cleaned["personalDataTypes"]).toEqual(["GDPR_ART_9"]);
  });

  it("passes through answers untouched when no controls use hideOptions", () => {
    const plainUischema: UISchema = {
      elements: [
        {
          options: { widget: "radio" },
          scope: "#/properties/legalBasisPublicInterest",
          type: "Control",
        },
      ],
      type: "VerticalLayout",
    };
    const cleaned = stripHiddenOptionValuesFromAnswers(
      { legalBasisPublicInterest: "PUBLIC_INTEREST_TASK" },
      plainUischema,
    );
    expect(cleaned).toEqual({
      legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
    });
  });

  // Stripping a hidden option can cascade through SHOW rules: a dependent
  // field stays in the answers (it has no hideOptions of its own) but must
  // drop out of `getVisibleFields` once its parent value is gone. Computing
  // visibility on the cleaned answers is what makes the dependent field
  // exit the payload in DynamicFormStep.
  it("cascade: stripped parent option drops dependent field from visibility", () => {
    const cascadeUischema: UISchema = {
      elements: [
        {
          options: { widget: "checkbox" },
          scope: "#/properties/personalDataTypes",
          type: "Control",
        },
        {
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
        },
        {
          options: { widget: "textarea" },
          rule: {
            condition: {
              schema: { const: "PUBLIC_INTEREST_TASK" },
              scope: "#/properties/legalBasisPublicInterest",
            },
            effect: "SHOW",
          },
          scope: "#/properties/publicInterestTaskText",
          type: "Control",
        },
      ],
      type: "VerticalLayout",
    };

    const cleaned = stripHiddenOptionValuesFromAnswers(
      {
        legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
        personalDataTypes: ["GDPR_ART_9"],
        publicInterestTaskText: "some text",
      },
      cascadeUischema,
    );

    expect(cleaned["legalBasisPublicInterest"]).toBeUndefined();
    expect(cleaned["publicInterestTaskText"]).toBe("some text");

    const visible = getVisibleFields(cascadeUischema, cleaned);
    expect(visible.has("publicInterestTaskText")).toBe(false);
  });
});
