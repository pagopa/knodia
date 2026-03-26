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

import type { API_PurposeSeed } from "../src/models/purpose/api.ts";

import { remoteResourceDbService } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

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

describe("POST /purposes (createPurpose)", () => {
  const purpose = getMockPurpose();
  const knodeId = "Orion";

  const body: API_PurposeSeed = {
    dailyCalls: purpose.dailyCalls,
    description: purpose.description,
    eserviceId: purpose.eserviceId,
    formAnswersJson: purpose.formAnswersJson,
    formSchemaVersion: purpose.formSchemaVersion,
    knodeId,
    name: purpose.name,
  };

  const k2kBody: k2kGatewayApi.PurposeSeed = {
    consumerId: TEST_ORGANIZATION_ID,
    dailyCalls: purpose.dailyCalls,
    description: purpose.description,
    eserviceId: purpose.eserviceId,
    formAnswersJson: purpose.formAnswersJson,
    formSchemaVersion: purpose.formSchemaVersion,
    name: purpose.name,
  };

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

    expect(response.json()).toEqual(mockK2KResponse);

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
    {
      body: { ...body, wrongProperty: "wrong" },
    },
    {
      body: { ...body, eserviceId: 99 },
    },
    {
      body: { ...body, eserviceId: "" },
    },
    {
      body: { ...body, dailyCalls: -1 },
    },
    {
      body: { ...body, dailyCalls: "not-a-number" },
    },
  ])(
    "should return 400 if query/body parameters are formatted incorrectly (%o)",
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
