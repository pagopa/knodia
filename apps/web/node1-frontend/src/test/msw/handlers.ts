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
        properties: {
          purpose: { enum: ["INSTITUTIONAL", "OTHER"], type: "string" },
          purposeDescription: { type: "string" },
        },
        required: ["purpose", "purposeDescription"],
        type: "object",
      },
      texts: {
        en: {
          fields: {
            purpose: {
              errors: { required: "Please select a purpose" },
              label: "Purpose of access data",
              options: {
                INSTITUTIONAL: "For institutional purposes",
                OTHER: "Other",
              },
            },
          },
          groups: {
            test: { label: "Test" },
          },
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
            ],
            textKey: "test",
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
];
