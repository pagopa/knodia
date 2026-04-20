import { http, HttpResponse } from "msw";

const BASE_URL = import.meta.env["BFF_URL"];

export const handlers = [
  http.get(`${BASE_URL}/session/organization`, () =>
    HttpResponse.json({
      attributes: [{ code: "nuts3", scheme: "vc_territorial_units" }],
      id: "20000000-2000-1000-8000-000000000002",
      knodeId: "Orion",
      name: "Test Organization",
    }),
  ),

  http.get(`${BASE_URL}/consumer/purposes/formSchemas/current`, () =>
    HttpResponse.json({
      schema: {
        additionalProperties: false,
        allOf: [
          {
            else: { properties: { institutionalPurpose: false } },
            if: {
              properties: { purpose: { const: "INSTITUTIONAL" } },
              required: ["purpose"],
            },
            then: { required: ["institutionalPurpose"] },
          },
        ],
        properties: {
          declarationConfirmGDPR: { const: "true", type: "string" },
          institutionalPurpose: { maxLength: 2000, type: "string" },
          personalDataTypes: {
            default: [],
            items: {
              enum: ["WITH_NON_IDENTIFYING_DATA", "WITH_IDENTIFYING_DATA"],
              type: "string",
            },
            type: "array",
            uniqueItems: true,
          },
          purpose: {
            default: "INSTITUTIONAL",
            enum: ["INSTITUTIONAL", "OTHER"],
            type: "string",
          },
        },
        required: ["purpose", "personalDataTypes", "declarationConfirmGDPR"],
        type: "object",
      },
      uiSchema: {
        elements: [
          {
            elements: [
              {
                label: "Purpose of data access",
                options: {
                  optionLabels: {
                    INSTITUTIONAL: "Institutional",
                    OTHER: "Other",
                  },
                  widget: "radio",
                },
                scope: "#/properties/purpose",
                type: "Control",
              },
              {
                label: "Describe your purpose",
                options: { widget: "textarea" },
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
                label: "Personal data types",
                options: { widget: "multiselect" },
                scope: "#/properties/personalDataTypes",
                type: "Control",
              },
              {
                label: "I confirm GDPR compliance",
                options: { widget: "checkbox" },
                scope: "#/properties/declarationConfirmGDPR",
                type: "Control",
              },
            ],
            label: "Purpose",
            type: "Group",
          },
        ],
        type: "VerticalLayout",
      },
      version: "1.0",
    }),
  ),

  http.get(`${BASE_URL}/producer/eservices`, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    return HttpResponse.json({
      pagination: { limit, offset, total: 0 },
      results: [],
    });
  }),

  http.post(`${BASE_URL}/producer/eservices`, () =>
    HttpResponse.json({ id: "test-eservice-id" }, { status: 201 }),
  ),

  http.get(`${BASE_URL}/producer/purposes`, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    return HttpResponse.json({
      pagination: { limit, offset, total: 0 },
      results: [],
    });
  }),
];
