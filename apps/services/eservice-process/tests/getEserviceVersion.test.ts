import { describe, expect, it } from "vitest";

import type { API_EserviceVersion } from "../src/models/api.ts";

import { injectAppRequest } from "./utils.ts";

const VALID_ESERVICE_ID = "00000000-0000-4000-a000-000000000000";
const NON_EXISTENT_ESERVICE_ID = "00000000-0000-4000-a000-ffffffffffff";

const getEserviceVersion = (eserviceId: string) =>
  injectAppRequest().get(`/eservices/${eserviceId}/version`);

// TODO: These tests rely on mock data. Update assertions when switching to real data.
describe("GET /eservices/:eserviceId/version (getEserviceVersion)", () => {
  it("should return the latest version with correct shape", async () => {
    const response = await getEserviceVersion(VALID_ESERVICE_ID);

    expect(response.statusCode).toBe(200);

    const body = response.json<API_EserviceVersion>();
    expect(body).toEqual(
      expect.objectContaining({
        accessTokenAudience: expect.any(Array),
        accessTokenDuration: expect.any(Number),
        accessTokenType: expect.stringMatching(/^(Bearer|DPoP)$/),
        createdAt: expect.any(String),
        id: expect.any(String),
        interfaceDocument: expect.objectContaining({
          checksum: expect.any(String),
          contentType: expect.any(String),
          id: expect.any(String),
          name: expect.any(String),
          path: expect.any(String),
          prettyName: expect.objectContaining({ en: expect.any(String) }),
        }),
        maxDailyCallsPerConsumer: expect.any(Number),
        maxDailyCallsPerKnode: expect.any(Number),
        requiredAttributes: expect.any(Array),
        state: expect.stringMatching(/^(Active|Suspended|Archived)$/),
        updatedAt: expect.any(String),
        versionNumber: expect.any(Number),
      }),
    );
  });

  it("should return version state consistent with e-service status", async () => {
    const eserviceResponse = await injectAppRequest().get(
      `/eservices/${VALID_ESERVICE_ID}`,
    );
    const eservice = eserviceResponse.json<{ status: string }>();

    const versionResponse = await getEserviceVersion(VALID_ESERVICE_ID);
    const version = versionResponse.json<API_EserviceVersion>();

    expect(version.state).toBe(eservice.status);
  });

  it("should return 404 for non-existent e-service id", async () => {
    const response = await getEserviceVersion(NON_EXISTENT_ESERVICE_ID);
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid e-service id format", async () => {
    const response = await getEserviceVersion("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
