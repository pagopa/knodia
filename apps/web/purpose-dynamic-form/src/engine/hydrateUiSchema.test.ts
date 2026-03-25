import { describe, expect, it } from "vitest";

import type { FormTexts, UISchema } from "./types";

import { hydrateUiSchema } from "./hydrateUiSchema";

const texts: FormTexts = {
  banners: {
    dpiaReminder: "DPIA is mandatory",
  },
  fields: {
    deliveryMethod: {
      label: "Delivery method",
    },
    purpose: {
      description: "Select your purpose",
      errors: {
        required: "Required",
      },
      label: "Purpose of access",
      options: {
        INSTITUTIONAL: "Institutional",
        OTHER: "Other",
      },
    },
  },
  groups: {
    legalBasis: {
      description: "Declare the lawfulness",
      label: "Legal basis",
    },
  },
};

describe("hydrateUiSchema", () => {
  it("injects label and options into a control", () => {
    const uischema: UISchema = {
      elements: [
        {
          options: { widget: "select" as const },
          scope: "#/properties/purpose",
          type: "Control" as const,
        },
      ],
      type: "VerticalLayout",
    };

    const result = hydrateUiSchema(uischema, texts);

    expect(result.elements.at(0)).toMatchObject({
      label: "Purpose of access",
      options: {
        errorMessages: { required: "Required" },
        infoLabel: "Select your purpose",
        optionLabels: { INSTITUTIONAL: "Institutional", OTHER: "Other" },
        widget: "select",
      },
    });
  });

  it("does not overwrite existing inline label", () => {
    const uischema: UISchema = {
      elements: [
        {
          label: "Inline label",
          options: { widget: "select" as const },
          scope: "#/properties/purpose",
          type: "Control" as const,
        },
      ],
      type: "VerticalLayout",
    };

    const result = hydrateUiSchema(uischema, texts);

    expect(result.elements.at(0)).toMatchObject({ label: "Inline label" });
  });

  it("does not overwrite existing inline optionLabels", () => {
    const uischema: UISchema = {
      elements: [
        {
          options: {
            optionLabels: { INSTITUTIONAL: "Custom" },
            widget: "select" as const,
          },
          scope: "#/properties/purpose",
          type: "Control" as const,
        },
      ],
      type: "VerticalLayout",
    };

    const result = hydrateUiSchema(uischema, texts);

    expect(result.elements.at(0)).toMatchObject({
      options: { optionLabels: { INSTITUTIONAL: "Custom" } },
    });
  });

  it("injects group label and description via textKey", () => {
    const uischema: UISchema = {
      elements: [
        {
          elements: [
            {
              options: { widget: "text" as const },
              scope: "#/properties/deliveryMethod",
              type: "Control" as const,
            },
          ],
          textKey: "legalBasis",
          type: "Group" as const,
        },
      ],
      type: "VerticalLayout",
    };

    const result = hydrateUiSchema(uischema, texts);

    expect(result.elements.at(0)).toMatchObject({
      label: "Legal basis",
      options: { description: "Declare the lawfulness" },
    });
  });

  it("does not overwrite existing group label", () => {
    const uischema: UISchema = {
      elements: [
        {
          elements: [],
          label: "Inline group label",
          textKey: "legalBasis",
          type: "Group" as const,
        },
      ],
      type: "VerticalLayout",
    };

    const result = hydrateUiSchema(uischema, texts);

    expect(result.elements.at(0)).toMatchObject({
      label: "Inline group label",
    });
  });

  it("injects banner text via textKey", () => {
    const uischema: UISchema = {
      elements: [
        {
          textKey: "dpiaReminder",
          type: "Label" as const,
        },
      ],
      type: "VerticalLayout",
    };

    const result = hydrateUiSchema(uischema, texts);

    expect(result.elements.at(0)).toMatchObject({
      text: "DPIA is mandatory",
    });
  });

  it("does not overwrite existing banner text", () => {
    const uischema: UISchema = {
      elements: [
        {
          text: "Inline text",
          textKey: "dpiaReminder",
          type: "Label" as const,
        },
      ],
      type: "VerticalLayout",
    };

    const result = hydrateUiSchema(uischema, texts);

    expect(result.elements.at(0)).toMatchObject({ text: "Inline text" });
  });

  it("does not mutate the original uischema", () => {
    const uischema: UISchema = {
      elements: [
        {
          options: { widget: "select" as const },
          scope: "#/properties/purpose",
          type: "Control" as const,
        },
      ],
      type: "VerticalLayout",
    };

    hydrateUiSchema(uischema, texts);
    const control = uischema.elements.at(0);

    expect(control).not.toHaveProperty("label");
    expect(control).toHaveProperty("options");
    expect(
      (control as { options: Record<string, unknown> }).options,
    ).not.toHaveProperty("infoLabel");
  });

  it("handles control with no matching text gracefully", () => {
    const uischema: UISchema = {
      elements: [
        {
          options: { widget: "text" as const },
          scope: "#/properties/unknownField",
          type: "Control" as const,
        },
      ],
      type: "VerticalLayout",
    };

    const result = hydrateUiSchema(uischema, texts);
    const control = result.elements.at(0);

    expect(control).not.toHaveProperty("label");
    expect(control).toMatchObject({ options: { widget: "text" } });
  });
});
