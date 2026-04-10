/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { generateId } from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockConsumerKeychain,
  getMockConsumerKeychainPurpose,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { toAPI_ConsumerKeychainPurpose } from "../src/models/apiConverter.ts";
import { keychainWriterService } from "./setup.ts";
import { injectAppRequest, seedConsumerKeychain } from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

const consumerKeychain = getMockConsumerKeychain();
const mockPurpose = {
  ...getMockConsumerKeychainPurpose(0),
  consumerKeychainId: consumerKeychain.id,
};

const seedData = async () => {
  await seedConsumerKeychain(consumerKeychain);
  await keychainWriterService.upsertConsumerKeychainPurpose(mockPurpose, 1);
};

describe("GET /consumerKeychains/:consumerKeychainId/purposes/:purposeId (getConsumerKeychainPurpose)", () => {
  it("should return 200 with the purpose link on success", async () => {
    await seedData();

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(
        `/consumerKeychains/${consumerKeychain.id}/purposes/${mockPurpose.purpose.id}`,
      )
      .query({ knodeId: mockPurpose.purpose.knodeId });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(toAPI_ConsumerKeychainPurpose(mockPurpose));
  });

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type)",
    async (token) => {
      await seedData();

      const response = await injectAppRequest(token)
        .get(
          `/consumerKeychains/${consumerKeychain.id}/purposes/${mockPurpose.purpose.id}`,
        )
        .query({ knodeId: mockPurpose.purpose.knodeId });
      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token)
        .get(
          `/consumerKeychains/${consumerKeychain.id}/purposes/${mockPurpose.purpose.id}`,
        )
        .query({ knodeId: mockPurpose.purpose.knodeId });
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent consumer keychain", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(
        `/consumerKeychains/${generateId()}/purposes/${mockPurpose.purpose.id}`,
      )
      .query({ knodeId: mockPurpose.purpose.knodeId });
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 when purpose is not linked to keychain", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/consumerKeychains/${consumerKeychain.id}/purposes/${generateId()}`)
      .query({ knodeId: mockPurpose.purpose.knodeId });
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 when knodeId does not match", async () => {
    await seedData();

    const wrongKnodeId =
      mockPurpose.purpose.knodeId === "Orion" ? "Lynx" : "Orion";
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(
        `/consumerKeychains/${consumerKeychain.id}/purposes/${mockPurpose.purpose.id}`,
      )
      .query({ knodeId: wrongKnodeId });
    expect(response.statusCode).toBe(404);
  });

  it.each([
    { params: { keychainId: "not-a-uuid", purposeId: mockPurpose.purpose.id }, query: { knodeId: mockPurpose.purpose.knodeId }, testCase: "invalid keychainId" },
    { params: { keychainId: consumerKeychain.id, purposeId: "not-a-uuid" }, query: { knodeId: mockPurpose.purpose.knodeId }, testCase: "invalid purposeId" },
    { params: { keychainId: consumerKeychain.id, purposeId: mockPurpose.purpose.id }, query: { knodeId: "InvalidKnode" }, testCase: "invalid knodeId" },
    { params: { keychainId: consumerKeychain.id, purposeId: mockPurpose.purpose.id }, query: {} as Record<string, string>, testCase: "missing knodeId" },
  ])(
    "should return 400 for invalid parameters: $testCase",
    async ({ params, query }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get(
          `/consumerKeychains/${params.keychainId}/purposes/${params.purposeId}`,
        )
        .query(query);
      expect(response.statusCode).toBe(400);
    },
  );
});
