/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  type EserviceId,
  generateId,
  type ProducerKeychainId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockProducerKeychain,
  getMockProducerKeychainEservice,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { toAPI_ProducerKeychainEservice } from "../../src/models/apiConverter.ts";
import { producerKeychainWriterService } from "../setup.ts";
import { injectAppRequest, seedProducerKeychain } from "../utils.ts";

const allowedTestTokens: Extract<TestToken, { type: "ui-session" }>[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const producerKeychain = getMockProducerKeychain();
const mockEservice = {
  ...getMockProducerKeychainEservice(0),
  producerKeychainId: producerKeychain.id,
};

async function getProducerKeychainEservice({
  eserviceId = mockEservice.eserviceId,
  producerKeychainId = producerKeychain.id,
  token = {
    ...allowedTestTokens[0]!,
    organizationId: producerKeychain.ownerId,
  },
}: {
  eserviceId?: EserviceId;
  producerKeychainId?: ProducerKeychainId;
  token?: TestToken;
} = {}) {
  return await injectAppRequest(token).get(
    `/producerKeychains/${producerKeychainId}/eservices/${eserviceId}`,
  );
}

const seedData = async () => {
  await seedProducerKeychain(producerKeychain);
  await producerKeychainWriterService.upsertProducerKeychainEservice(
    mockEservice,
    1,
  );
};

describe("GET /producerKeychains/:producerKeychainId/eservices/:eserviceId (getProducerKeychainEservice)", () => {
  it("should return 200 with the eservice link on success", async () => {
    await seedData();

    const response = await getProducerKeychainEservice();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      toAPI_ProducerKeychainEservice(mockEservice),
    );
  });

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      await seedData();

      const response = await getProducerKeychainEservice({ token });
      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getProducerKeychainEservice({ token });
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent producer keychain", async () => {
    const response = await getProducerKeychainEservice({
      producerKeychainId: generateId<ProducerKeychainId>(),
    });
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 when eservice is not linked to keychain", async () => {
    await seedProducerKeychain(producerKeychain);

    const response = await getProducerKeychainEservice({
      eserviceId: generateId<EserviceId>(),
      producerKeychainId: producerKeychain.id,
    });
    expect(response.statusCode).toBe(404);
  });

  it.each([
    {
      params: {
        eserviceId: mockEservice.eserviceId,
        keychainId: "not-a-uuid",
      },
      testCase: "invalid keychainId",
    },
    {
      params: { eserviceId: "not-a-uuid", keychainId: producerKeychain.id },
      testCase: "invalid eserviceId",
    },
  ])(
    "should return 400 for invalid parameters: $testCase",
    async ({ params }) => {
      const response = await getProducerKeychainEservice({
        eserviceId: params.eserviceId as EserviceId,
        producerKeychainId: params.keychainId as ProducerKeychainId,
      });
      expect(response.statusCode).toBe(400);
    },
  );
});
