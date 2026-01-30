import { describe, expect, it } from "vitest";

import type { API_EserviceSeed } from "../src/models/api.ts";

import { getAllEserviceEvents, injectAppRequest } from "./utils.ts";

describe("POST /eservices (createEservice)", () => {
  it("should correctly create eservice creation event", async () => {
    const body: API_EserviceSeed = {
      name: "Test E-service",
    };
    const response = await injectAppRequest().post("/eservices").body(body);
    expect(response.statusCode).toBe(201);

    const events = await getAllEserviceEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "EserviceVersionActivatedV1",
    });
  });
});
