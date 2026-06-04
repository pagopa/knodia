/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type EserviceId, generateId } from "@knodia/common-models/ids";
import { EserviceMode } from "@knodia/eservice-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockEservice,
  getMockPurposeFormOption,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  API_PurposeFormOption,
  API_PurposeFormOptions,
} from "../src/models/api.ts";

import { injectAppRequest, seedEservice } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { type: "internal" },
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getOptions = (
  eserviceId: string,
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/eservices/${eserviceId}/purposeFormOptions`);

describe("GET /eservices/:eserviceId/purposeFormOptions", () => {
  it.each(allowedTestTokens)(
    "should return the options published on the ReceiveData e-service ($type, $roles)",
    async (token) => {
      const purposeFormOptions = [
        getMockPurposeFormOption(0),
        getMockPurposeFormOption(1),
      ];
      const eservice = {
        ...getMockEservice({
          latestVersionState: "Active",
          purposeFormOptions,
          seed: 100,
        }),
        mode: EserviceMode.enum.ReceiveData,
      };
      await seedEservice(eservice);

      const response = await getOptions(eservice.id, token);
      expect(response.statusCode).toBe(200);

      const body = response.json<API_PurposeFormOptions>();
      expect(body.items).toHaveLength(purposeFormOptions.length);
      expect(body.items).toEqual(
        expect.arrayContaining(
          purposeFormOptions.map<API_PurposeFormOption>((option) => ({
            description: option.description,
            formAnswersJson: option.formAnswersJson,
            formSchemaVersion: option.formSchemaVersion,
            id: option.id,
            name: option.name,
          })),
        ),
      );
    },
  );

  it("should return an empty list for an e-service without receiveDataConfig", async () => {
    const eservice = getMockEservice({
      latestVersionState: "Active",
      seed: 101,
    });
    await seedEservice(eservice);

    const response = await getOptions(eservice.id);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ items: [] });
  });

  it("should return 404 if the e-service does not exist", async () => {
    const response = await getOptions(generateId<EserviceId>());
    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 401/403 for unauthorized token ($type)",
    async (token) => {
      const response = await getOptions(generateId<EserviceId>(), token);
      expect([401, 403]).toContain(response.statusCode);
    },
  );
});
