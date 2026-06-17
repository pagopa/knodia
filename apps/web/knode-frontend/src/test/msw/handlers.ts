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
          institutionalPurpose: {
            maxLength: 2000,
            minLength: 1,
            type: "string",
          },
          personalDataTypes: {
            default: [],
            items: {
              enum: ["WITH_NON_IDENTIFYING_DATA", "WITH_IDENTIFYING_DATA"],
              type: "string",
            },
            minItems: 1,
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
      texts: {
        en: {
          "declarationConfirmGDPR.label": "I confirm GDPR compliance",
          "groups.test.label": "Test",
          "institutionalPurpose.label": "Describe your purpose",
          "personalDataTypes.label": "Personal data types",
          "purpose.INSTITUTIONAL": "For institutional purposes",
          "purpose.label": "Purpose of access data",
          "purpose.OTHER": "Other",
        },
      },
      uiSchema: {
        elements: [
          {
            elements: [
              {
                options: { widget: "radio" },
                scope: "#/properties/purpose",
                type: "Control",
              },
              {
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
                options: { widget: "checkbox" },
                scope: "#/properties/personalDataTypes",
                type: "Control",
              },
              {
                options: { widget: "checkbox" },
                scope: "#/properties/declarationConfirmGDPR",
                type: "Control",
              },
            ],
            i18n: "groups.test",
            type: "Group",
          },
        ],
        type: "VerticalLayout",
      },
      uiTexts: {
        en: {
          "purpose.error.required": "Please select a purpose",
        },
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

  http.get(
    `${BASE_URL}/producerKeychains/:producerKeychainId/membership/:userId`,
    () => HttpResponse.json({ isMember: false }),
  ),

  http.get(
    `${BASE_URL}/consumerKeychains/:consumerKeychainId/membership/:userId`,
    () => HttpResponse.json({ isMember: false }),
  ),

  http.get(
    `${BASE_URL}/knodeApiKeychains/:knodeApiKeychainId/membership/:userId`,
    () => HttpResponse.json({ isMember: false }),
  ),

  http.get(
    `${BASE_URL}/producerKeychains/:producerKeychainId/keys`,
    ({ request }) => {
      const url = new URL(request.url);
      const limit = Number(url.searchParams.get("limit") ?? 50);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      return HttpResponse.json({
        pagination: { limit, offset, total: 0 },
        results: [],
      });
    },
  ),
];
