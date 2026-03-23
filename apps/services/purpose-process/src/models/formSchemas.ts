export const CURRENT_FORM_SCHEMA_VERSION = "1.0";

// JSON Schema (Draft 2020-12) for validating purpose form answers.
// This schema defines the standard questions every knode must support.
export const formSchemas: Record<string, unknown> = {
  "1.0": {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    allOf: [
      {
        else: { properties: { institutionalPurpose: false } },
        if: { properties: { purpose: { const: "INSTITUTIONAL" } } },
        then: { required: ["institutionalPurpose"] },
      },
      {
        else: { properties: { otherPurpose: false } },
        if: { properties: { purpose: { const: "OTHER" } } },
        then: { required: ["otherPurpose"] },
      },
      {
        else: {
          properties: {
            usesThirdPartyConfidentialData: false,
            usesThirdPartyPersonalData: false,
          },
        },
        if: { properties: { usesPersonalData: { const: "NO" } } },
        then: { required: ["usesThirdPartyPersonalData"] },
      },
      {
        else: { properties: { usesThirdPartyConfidentialData: false } },
        if: {
          properties: {
            usesPersonalData: { const: "NO" },
            usesThirdPartyPersonalData: { const: "YES" },
          },
          required: ["usesThirdPartyPersonalData"],
        },
        then: { required: ["usesThirdPartyConfidentialData"] },
      },
      {
        else: {
          properties: {
            legalBasis: false,
            legalObligationReference: false,
            otherPersonalDataTypes: false,
            personalDataTypes: false,
          },
        },
        if: { properties: { usesPersonalData: { const: "YES" } } },
        then: { required: ["personalDataTypes", "legalBasis"] },
      },
      {
        else: { properties: { otherPersonalDataTypes: false } },
        if: {
          properties: {
            personalDataTypes: { contains: { const: "OTHER" } },
            usesPersonalData: { const: "YES" },
          },
          required: ["personalDataTypes"],
        },
        then: { required: ["otherPersonalDataTypes"] },
      },
      {
        else: { properties: { legalObligationReference: false } },
        if: {
          properties: {
            legalBasis: { contains: { const: "LEGAL_OBLIGATION" } },
            usesPersonalData: { const: "YES" },
          },
          required: ["legalBasis"],
        },
        then: { required: ["legalObligationReference"] },
      },
    ],
    properties: {
      institutionalPurpose: {
        maxLength: 2000,
        type: "string",
      },
      legalBasis: {
        items: {
          enum: [
            "CONSENT",
            "CONTRACT",
            "LEGAL_OBLIGATION",
            "SAFEGUARD",
            "PUBLIC_INTEREST",
          ],
          type: "string",
        },
        minItems: 1,
        type: "array",
        uniqueItems: true,
      },
      legalObligationReference: {
        maxLength: 2000,
        type: "string",
      },
      otherPersonalDataTypes: {
        maxLength: 2000,
        type: "string",
      },
      otherPurpose: {
        maxLength: 2000,
        type: "string",
      },
      personalDataTypes: {
        items: {
          enum: [
            "WITH_NON_IDENTIFYING_DATA",
            "WITH_IDENTIFYING_DATA",
            "GDPR_ART_8",
            "GDPR_ART_9",
            "GDPR_ART_10",
            "OTHER",
          ],
          type: "string",
        },
        minItems: 1,
        type: "array",
        uniqueItems: true,
      },
      purpose: {
        enum: ["INSTITUTIONAL", "OTHER"],
        type: "string",
      },
      usesPersonalData: {
        enum: ["YES", "NO"],
        type: "string",
      },
      usesThirdPartyConfidentialData: {
        enum: ["YES", "NO"],
        type: "string",
      },
      usesThirdPartyPersonalData: {
        enum: ["YES", "NO"],
        type: "string",
      },
    },
    required: ["purpose", "usesPersonalData"],
    type: "object",
  },
};

// JSON Forms UI Schema for rendering purpose forms.
// Defines layout, widgets, visibility rules, and labels for the frontend.
export const formUiSchemas: Record<string, unknown> = {
  "1.0": {
    elements: [
      {
        elements: [
          {
            label: "Purpose of data access",
            options: { format: "radio" },
            scope: "#/properties/purpose",
            type: "Control",
          },
          {
            label: "Describe the institutional purpose",
            options: { multi: true },
            rule: {
              condition: {
                schema: { const: "INSTITUTIONAL" },
                scope: "#/properties/purpose",
              },
              effect: "SHOW",
            },
            scope: "#/properties/institutionalPurpose",
            type: "Control",
          },
          {
            label: "Describe the other purpose",
            options: { multi: true },
            rule: {
              condition: {
                schema: { const: "OTHER" },
                scope: "#/properties/purpose",
              },
              effect: "SHOW",
            },
            scope: "#/properties/otherPurpose",
            type: "Control",
          },
        ],
        label: "Purpose",
        type: "Group",
      },
      {
        elements: [
          {
            label: "Does this purpose involve personal data?",
            options: { format: "radio" },
            scope: "#/properties/usesPersonalData",
            type: "Control",
          },
          {
            label: "Does it involve third-party non-personal data?",
            options: { format: "radio" },
            rule: {
              condition: {
                schema: { const: "NO" },
                scope: "#/properties/usesPersonalData",
              },
              effect: "SHOW",
            },
            scope: "#/properties/usesThirdPartyPersonalData",
            type: "Control",
          },
          {
            label: "Does it involve third-party confidential data?",
            options: { format: "radio" },
            rule: {
              condition: {
                conditions: [
                  {
                    schema: { const: "NO" },
                    scope: "#/properties/usesPersonalData",
                  },
                  {
                    schema: { const: "YES" },
                    scope: "#/properties/usesThirdPartyPersonalData",
                  },
                ],
                type: "AND",
              },
              effect: "SHOW",
            },
            scope: "#/properties/usesThirdPartyConfidentialData",
            type: "Control",
          },
          {
            label: "Types of personal data involved",
            options: { format: "checkbox" },
            rule: {
              condition: {
                schema: { const: "YES" },
                scope: "#/properties/usesPersonalData",
              },
              effect: "SHOW",
            },
            scope: "#/properties/personalDataTypes",
            type: "Control",
          },
          {
            label: "Describe the other personal data types",
            options: { multi: true },
            rule: {
              condition: {
                conditions: [
                  {
                    schema: { const: "YES" },
                    scope: "#/properties/usesPersonalData",
                  },
                  {
                    schema: { contains: { const: "OTHER" } },
                    scope: "#/properties/personalDataTypes",
                  },
                ],
                type: "AND",
              },
              effect: "SHOW",
            },
            scope: "#/properties/otherPersonalDataTypes",
            type: "Control",
          },
          {
            label: "Legal basis for data processing",
            options: { format: "checkbox" },
            rule: {
              condition: {
                schema: { const: "YES" },
                scope: "#/properties/usesPersonalData",
              },
              effect: "SHOW",
            },
            scope: "#/properties/legalBasis",
            type: "Control",
          },
          {
            label: "Legal obligation reference",
            options: { multi: true },
            rule: {
              condition: {
                conditions: [
                  {
                    schema: { const: "YES" },
                    scope: "#/properties/usesPersonalData",
                  },
                  {
                    schema: { contains: { const: "LEGAL_OBLIGATION" } },
                    scope: "#/properties/legalBasis",
                  },
                ],
                type: "AND",
              },
              effect: "SHOW",
            },
            scope: "#/properties/legalObligationReference",
            type: "Control",
          },
        ],
        label: "Data Protection",
        type: "Group",
      },
    ],
    type: "VerticalLayout",
  },
};
