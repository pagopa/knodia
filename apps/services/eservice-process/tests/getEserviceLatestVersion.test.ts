/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EserviceId, generateId } from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { toExpectAPI_EserviceVersion } from "@knodia/test-commons/utils";
import { beforeAll, describe, expect, it } from "vitest";

import type { API_EserviceVersion } from "../src/models/api.ts";

import { mockEservices } from "./mockEservices.ts";
import { eserviceWriterService } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

const eservice = mockEservices[0]!;
const VALID_ESERVICE_ID = eservice.id;
const NON_EXISTENT_ESERVICE_ID = generateId<EserviceId>();

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /eservices/:eserviceId/versions/latest (getEserviceLatestVersion)", () => {
  beforeAll(async () => {
    await Promise.all(
      mockEservices.map((eservice) =>
        eserviceWriterService.upsertEservice(eservice, 0),
      ),
    );
  });

  it.each(allowedTestTokens)(
    "should return the latest version with correct shape ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        `/eservices/${VALID_ESERVICE_ID}/versions/latest`,
      );

      expect(response.statusCode).toBe(200);

      const body = response.json<API_EserviceVersion>();
      expect(body).toEqual(toExpectAPI_EserviceVersion(eservice.versions[1]!));
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token).get(
        `/eservices/${VALID_ESERVICE_ID}/versions/latest`,
      );
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent e-service id", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).get(
      `/eservices/${NON_EXISTENT_ESERVICE_ID}/versions/latest`,
    );
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid e-service id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).get(
      "/eservices/not-a-uuid/versions/latest",
    );
    expect(response.statusCode).toBe(400);
  });
});
