/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EserviceId, generateId } from "@knodia/common-models/ids";
import {
  toExpectAPI_Eservice,
  upsertEservice,
} from "@knodia/test-commons/utils";
import { beforeAll, describe, expect, it } from "vitest";

import type { API_Eservice } from "../src/models/api.ts";

import { mockEservices } from "./mockEservices.ts";
import { readmodelDb } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

const eservice = mockEservices[0]!;
const VALID_ESERVICE_ID = eservice.id;
const NON_EXISTENT_ESERVICE_ID = generateId<EserviceId>();

const getEservice = (eserviceId: string) =>
  injectAppRequest().get(`/eservices/${eserviceId}`);

describe("GET /eservices/:eserviceId (getEservice)", () => {
  beforeAll(async () => {
    await Promise.all(
      mockEservices.map((eservice) => upsertEservice(eservice, 0, readmodelDb)),
    );
  });

  it("should return the e-service with correct shape", async () => {
    const response = await getEservice(VALID_ESERVICE_ID);

    expect(response.statusCode).toBe(200);

    const body = response.json<API_Eservice>();
    expect(body).toEqual(toExpectAPI_Eservice(eservice));
  });

  it("should return the same e-service as the list endpoint", async () => {
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
