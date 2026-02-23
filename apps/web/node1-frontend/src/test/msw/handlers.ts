import { http, HttpResponse } from "msw";

const BASE_URL = import.meta.env["BFF_URL"];

export const handlers = [
  http.get(`${BASE_URL}/producer/eservices`, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    return HttpResponse.json({
      items: [],
      pagination: { limit, offset, total: 0 },
    });
  }),

  http.post(`${BASE_URL}/producer/eservices`, () =>
    HttpResponse.json({ id: "test-eservice-id" }, { status: 201 }),
  ),
];
