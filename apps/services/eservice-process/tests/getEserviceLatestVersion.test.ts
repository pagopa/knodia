/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EserviceId, generateId } from "@knodia/common-models/ids";
import { beforeAll, describe, expect, it } from "vitest";

import type { API_EserviceVersion } from "../src/models/api.ts";

import { toAPI_EserviceVersion } from "../src/models/apiConverter.ts";
import { mockEservices } from "./mockEservices.ts";
import { eserviceWriterService } from "./setup.ts";
import { injectAppRequest, toExpectAPI_EserviceVersion } from "./utils.ts";

const eservice = mockEservices[0]!;
const VALID_ESERVICE_ID = eservice.id;
const NON_EXISTENT_ESERVICE_ID = generateId<EserviceId>();

const getEserviceLatestVersion = (eserviceId: string) =>
  injectAppRequest().get(`/eservices/${eserviceId}/versions/latest`);

describe("GET /eservices/:eserviceId/versions/latest (getEserviceLatestVersion)", () => {
  beforeAll(async () => {
    await Promise.all(
      mockEservices.map((eservice) =>
        eserviceWriterService.upsertEservice(eservice, 0),
      ),
    );
  });

  it("should return the latest version with correct shape", async () => {
    const response = await getEserviceLatestVersion(VALID_ESERVICE_ID);

    expect(response.statusCode).toBe(200);

    const body = response.json<API_EserviceVersion>();
    expect(body).toEqual(
      toExpectAPI_EserviceVersion(toAPI_EserviceVersion(eservice.versions[1]!)),
    );
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
