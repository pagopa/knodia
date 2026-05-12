/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { generateId } from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockConsumerKeychain,
  getMockConsumerKeychainPurpose,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { toAPI_ConsumerKeychainPurpose } from "../../src/models/apiConverter.ts";
import { consumerKeychainWriterService } from "../setup.ts";
import { injectAppRequest, seedConsumerKeychain } from "../utils.ts";

const allowedUiSessionTestTokens: Extract<TestToken, { type: "ui-session" }>[] =
  [
    { roles: ["administrative"], type: "ui-session" },
    { roles: ["technical"], type: "ui-session" },
  ];
const allowedTestTokens: TestToken[] = [
  { type: "internal" },
  ...allowedUiSessionTestTokens,
];

const consumerKeychain = getMockConsumerKeychain();
const mockPurpose = {
  ...getMockConsumerKeychainPurpose(0),
  consumerKeychainId: consumerKeychain.id,
};

const getConsumerKeychainPurpose = (
  consumerKeychainId: string,
  purposeId: string,
  knodeId: string,
  token: TestToken = {
    ...allowedUiSessionTestTokens[0]!,
    organizationId: consumerKeychain.ownerId,
  },
) =>
  injectAppRequest(token)
    .get(`/consumerKeychains/${consumerKeychainId}/purposes/${purposeId}`)
    .query({ knodeId });

const seedData = async () => {
  await seedConsumerKeychain(consumerKeychain);
  await consumerKeychainWriterService.upsertConsumerKeychainPurpose(
    mockPurpose,
    1,
  );
};

describe("GET /consumerKeychains/:consumerKeychainId/purposes/:purposeId (getConsumerKeychainPurpose)", () => {
  it("should return 200 with the purpose link on success", async () => {
    await seedData();

    const response = await getConsumerKeychainPurpose(
      consumerKeychain.id,
      mockPurpose.purpose.id,
      mockPurpose.purpose.knodeId,
    );

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(toAPI_ConsumerKeychainPurpose(mockPurpose));
  });

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      await seedData();

      const response = await getConsumerKeychainPurpose(
        consumerKeychain.id,
        mockPurpose.purpose.id,
        mockPurpose.purpose.knodeId,
        token.type === "ui-session"
          ? {
              ...token,
              organizationId: consumerKeychain.ownerId,
            }
          : token,
      );
      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getConsumerKeychainPurpose(
        consumerKeychain.id,
        mockPurpose.purpose.id,
        mockPurpose.purpose.knodeId,
        token,
      );
      expect(response.statusCode).toBe(403);
    },
  );

  it.each(allowedTestTokens)(
    "should return 404 for non-existent consumer keychain ($type, $roles)",
    async (token) => {
      const response = await getConsumerKeychainPurpose(
        generateId(),
        mockPurpose.purpose.id,
        mockPurpose.purpose.knodeId,
        token.type === "ui-session"
          ? {
              ...token,
              organizationId: consumerKeychain.ownerId,
            }
          : token,
      );
      expect(response.statusCode).toBe(404);
    },
  );

  it("should return 404 when purpose is not linked to keychain", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await getConsumerKeychainPurpose(
      consumerKeychain.id,
      generateId(),
      mockPurpose.purpose.knodeId,
      { type: "internal" },
    );
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 when knodeId does not match", async () => {
    await seedData();

    const wrongKnodeId =
      mockPurpose.purpose.knodeId === "Orion" ? "Lynx" : "Orion";
    const response = await getConsumerKeychainPurpose(
      consumerKeychain.id,
      mockPurpose.purpose.id,
      wrongKnodeId,
      { type: "internal" },
    );
    expect(response.statusCode).toBe(404);
  });

  it.each([
    {
      params: { keychainId: "not-a-uuid", purposeId: mockPurpose.purpose.id },
      query: { knodeId: mockPurpose.purpose.knodeId },
      testCase: "invalid keychainId",
    },
    {
      params: { keychainId: consumerKeychain.id, purposeId: "not-a-uuid" },
      query: { knodeId: mockPurpose.purpose.knodeId },
      testCase: "invalid purposeId",
    },
    {
      params: {
        keychainId: consumerKeychain.id,
        purposeId: mockPurpose.purpose.id,
      },
      query: { knodeId: "InvalidKnode" },
      testCase: "invalid knodeId",
    },
    {
      params: {
        keychainId: consumerKeychain.id,
        purposeId: mockPurpose.purpose.id,
      },
      query: {} as Record<string, string>,
      testCase: "missing knodeId",
    },
  ])(
    "should return 400 for invalid parameters: $testCase",
    async ({ params, query }) => {
      const response = await injectAppRequest({ type: "internal" })
        .get(
          `/consumerKeychains/${params.keychainId}/purposes/${params.purposeId}`,
        )
        .query(query);
      expect(response.statusCode).toBe(400);
    },
  );
});
