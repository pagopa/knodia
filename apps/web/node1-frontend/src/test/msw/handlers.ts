import { http, HttpResponse } from "msw";

const BASE_URL = import.meta.env["BFF_URL"];

export const handlers = [
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
      version: "1.0",
    }),
  ),

  http.get(`${BASE_URL}/consumer/purposes/formSchemas/current/ui`, () =>
    HttpResponse.json({
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
            label: "Test",
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
