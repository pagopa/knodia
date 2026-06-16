/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { RemoteResourcePurposeSQL } from "@knodia/db-remote-resource";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import {
  generateId,
  KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { getMockPurpose } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { API_PurposeSeed } from "../../src/models/purpose/api.ts";

import { remoteResourceDbService } from "../setup.ts";
import { injectAppRequest } from "../utils.ts";

type API_PurposeSeedReceiveData = Extract<
  API_PurposeSeed,
  { eserviceMode: "ReceiveData" }
>;

const createPurposeMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      createPurpose: createPurposeMock,
    },
  };
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /purposes (ReceiveData mode)", () => {
  const purpose = getMockPurpose();
  const knodeId = "Orion";
  const purposeFormOptionId = generateId();

  const body: API_PurposeSeedReceiveData = {
    dailyCalls: purpose.dailyCalls,
    description: purpose.description,
    eserviceId: purpose.eserviceId,
    eserviceMode: "ReceiveData",
    knodeId,
    name: purpose.name,
    purposeFormOptionId,
  };

  // RRM forwards CamelCase ReceiveData → UPPERCASE RECEIVE_DATA when calling
  // the k2k-gateway client.
  const k2kBody = {
    consumerId: TEST_ORGANIZATION_ID,
    dailyCalls: purpose.dailyCalls,
    description: purpose.description,
    eserviceId: purpose.eserviceId,
    eserviceMode: "RECEIVE_DATA",
    name: purpose.name,
    purposeFormOptionId,
  } satisfies k2kGatewayApi.PurposeSeed;

  // k2k gateway response — the owning knodeId is added by RRM, not returned here
  const mockK2KResponse = {
    id: purpose.id,
  };

  beforeEach(() => {
    createPurposeMock.mockReset();
  });

  it("should return 201 with converted results on success", async () => {
    createPurposeMock.mockResolvedValue({
      data: mockK2KResponse,
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body(body);

    expect(response.statusCode).toBe(201);

    expect(createPurposeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: k2kBody,
      }),
    );

    expect(response.json()).toEqual({ ...mockK2KResponse, knodeId });

    const remoteResourcePurpose = await remoteResourceDbService.getPurposeById(
      unsafeBrandExternalId(purpose.id),
      KnodeId.parse(knodeId),
    );
    const expectedRemoteResourcePurpose: RemoteResourcePurposeSQL = {
      consumerId: TEST_ORGANIZATION_ID,
      eserviceId: purpose.eserviceId,
      knodeId,
      purposeId: purpose.id,
    };

    expect(remoteResourcePurpose).toEqual(expectedRemoteResourcePurpose);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post("/purposes")
        .body(body);
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { body: {} },
    { body: { ...body, wrongProperty: "wrong" } },
    { body: { ...body, eserviceId: 99 } },
    { body: { ...body, eserviceId: "" } },
    { body: { ...body, dailyCalls: -1 } },
    { body: { ...body, dailyCalls: "not-a-number" } },
    { body: { ...body, purposeFormOptionId: "not-a-uuid" } },
    {
      body: {
        ...body,
        formAnswersJson: { foo: "bar" },
      },
    },
  ])(
    "should return 400 if body parameters are formatted incorrectly (%o)",
    async ({ body }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/purposes")
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization does not exist", async () => {
    const response = await injectAppRequest({
      organizationId: generateId<OrganizationId>(),
      roles: ["administrative"],
      type: "ui-session",
    })
      .post("/purposes")
      .body(body);
    expect(response.statusCode).toBe(403);
  });
});
