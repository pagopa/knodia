import { describe, expect, it } from "vitest";

import { injectAppRequest } from "./utils.ts";

describe("GET /eservices/:eserviceId (getEserviceById)", () => {
  // These assertions rely on the mock data returned by getMockEserviceById. They will need to be updated.
  it("should return the e-service details for a valid UUID", async () => {
    const eserviceId = crypto.randomUUID();
    const response = await injectAppRequest().get(`/eservices/${eserviceId}`);
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.id).toBe(eserviceId);
    expect(body.versions).toBeDefined();
    expect(body.versions).toHaveLength(1);
    expect(body.versions[0].state).toBe("Active");
    expect(body.versions[0].interfaceDocument).toBeDefined();
    expect(body.versions[0].requiredAttributes).toBeDefined();
  });

  it("should return 400 if eserviceId is not a valid UUID", async () => {
    const response = await injectAppRequest().get(
      "/eservices/not-a-valid-uuid",
    );
    expect(response.statusCode).toBe(400);
  });
});
