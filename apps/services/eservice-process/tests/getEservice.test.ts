import { describe, expect, it } from "vitest";

import type { API_Eservice } from "../src/models/api.ts";

import { injectAppRequest } from "./utils.ts";

const VALID_ESERVICE_ID = "00000000-0000-4000-a000-000000000000";
const NON_EXISTENT_ESERVICE_ID = "00000000-0000-4000-a000-ffffffffffff";

const getEservice = (eserviceId: string) =>
  injectAppRequest().get(`/eservices/${eserviceId}`);

// TODO: These tests rely on mock data. Update assertions when switching to real data.
describe("GET /eservices/:eserviceId (getEservice)", () => {
  it("should return the e-service with correct shape", async () => {
    const response = await getEservice(VALID_ESERVICE_ID);

    expect(response.statusCode).toBe(200);

    const body = response.json<API_Eservice>();
    expect(body).toEqual(
      expect.objectContaining({
        categories: expect.any(Array),
        createdAt: expect.any(String),
        description: expect.objectContaining({ en: expect.any(String) }),
        id: VALID_ESERVICE_ID,
        isConsumerOperatorIdentificationRequired: expect.any(Boolean),
        isSignalHubEnabled: expect.any(Boolean),
        mode: expect.stringMatching(/^(ProvideData|ReceiveData)$/),
        name: expect.objectContaining({ en: expect.any(String) }),
        producerId: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  // TODO: fix test after adding /eservices/:eserviceId logic
  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip("should return the same e-service as the list endpoint", async () => {
    const listResponse = await injectAppRequest()
      .get("/eservices")
      .query({ limit: "50", offset: "0" });
    const listBody = listResponse.json<{ items: API_Eservice[] }>();
    const expectedItem = listBody.items.find((i) => i.id === VALID_ESERVICE_ID);

    const response = await getEservice(VALID_ESERVICE_ID);
    const body = response.json<API_Eservice>();

    expect(body).toEqual(expectedItem);
  });

  it("should return 404 for non-existent e-service id", async () => {
    const response = await getEservice(NON_EXISTENT_ESERVICE_ID);
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid e-service id format", async () => {
    const response = await getEservice("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
