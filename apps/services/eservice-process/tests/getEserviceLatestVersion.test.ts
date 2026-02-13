import {
  API_AccessTokenType,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import { describe, expect, it } from "vitest";

import type { API_EserviceVersion } from "../src/models/api.ts";

import { injectAppRequest } from "./utils.ts";

const VALID_ESERVICE_ID = "00000000-0000-4000-a000-000000000000";
const NON_EXISTENT_ESERVICE_ID = "00000000-0000-4000-a000-ffffffffffff";

const getEserviceLatestVersion = (eserviceId: string) =>
  injectAppRequest().get(`/eservices/${eserviceId}/versions/latest`);

// TODO: These tests rely on mock data. Update assertions when switching to real data.
describe("GET /eservices/:eserviceId/versions/latest (getEserviceLatestVersion)", () => {
  it("should return the latest version with correct shape", async () => {
    const response = await getEserviceLatestVersion(VALID_ESERVICE_ID);

    expect(response.statusCode).toBe(200);

    const body = response.json<API_EserviceVersion>();
    expect(body).toEqual(
      expect.objectContaining({
        accessTokenAudience: expect.any(Array),
        accessTokenDuration: expect.any(Number),
        accessTokenType: expect.schemaMatching(API_AccessTokenType),
        createdAt: expect.any(String),
        id: expect.any(String),
        maxDailyCallsPerConsumer: expect.any(Number),
        maxDailyCallsPerKnode: expect.any(Number),
        requiredAttributes: expect.any(Array),
        state: expect.schemaMatching(API_EserviceVersionState),
        updatedAt: expect.any(String),
        versionNumber: expect.any(Number),
      }),
    );
  });

  it("should return version state consistent with e-service status", async () => {
    const eserviceResponse = await injectAppRequest().get(
      `/eservices/${VALID_ESERVICE_ID}`,
    );
    const eservice = eserviceResponse.json<{ state: string }>();

    const versionResponse = await getEserviceLatestVersion(VALID_ESERVICE_ID);
    const version = versionResponse.json<API_EserviceVersion>();

    expect(version.state).toBe(eservice.state);
  });

  it("should return 404 for non-existent e-service id", async () => {
    const response = await getEserviceLatestVersion(NON_EXISTENT_ESERVICE_ID);
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid e-service id format", async () => {
    const response = await getEserviceLatestVersion("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
