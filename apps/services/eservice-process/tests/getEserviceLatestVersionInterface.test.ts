/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EserviceId, generateId } from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { toExpectAPI_EserviceVersionInterfaceDocument } from "@knodia/test-commons/utils";
import { beforeAll, describe, expect, it } from "vitest";

import type { API_EserviceVersionInterfaceDocument } from "../src/models/api.ts";

import { mockEservices } from "./mockEservices.ts";
import { eserviceWriterService } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

const eservice = mockEservices[0]!;
const VALID_ESERVICE_ID = eservice.id;
const NON_EXISTENT_ESERVICE_ID = generateId<EserviceId>();

const allowedTestTokens: TestToken[] = [
  { type: "internal" },
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getEserviceLatestVersionInterface = (
  eserviceId: string,
  token: TestToken = allowedTestTokens[0]!,
) =>
  injectAppRequest(token).get(
    `/eservices/${eserviceId}/versions/latest/interface`,
  );

describe("GET /eservices/:eserviceId/versions/latest/interface (getEserviceLatestVersionInterface)", () => {
  beforeAll(async () => {
    await Promise.all(
      mockEservices.map((eservice) =>
        eserviceWriterService.upsertEservice(eservice, 0),
      ),
    );
  });

  it.each(allowedTestTokens)(
    "should return the latest version interface document with correct shape ($type, $roles)",
    async (token) => {
      const response = await getEserviceLatestVersionInterface(
        VALID_ESERVICE_ID,
        token,
      );

      expect(response.statusCode).toBe(200);

      const body = response.json<API_EserviceVersionInterfaceDocument>();
      expect(body).toEqual(
        toExpectAPI_EserviceVersionInterfaceDocument(
          eservice.versions[1]!.interfaceDocument,
        ),
      );
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getEserviceLatestVersionInterface(
        VALID_ESERVICE_ID,
        token,
      );
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent e-service id", async () => {
    const response = await getEserviceLatestVersionInterface(
      NON_EXISTENT_ESERVICE_ID,
    );
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid e-service id format", async () => {
    const response = await getEserviceLatestVersionInterface("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
