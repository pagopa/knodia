/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { RemoteResourceAgreementSQL } from "@knodia/db-remote-resource";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { API_CreatedResource } from "@knodia/common-models/api";
import { generateId, KnodeId, unsafeBrandId } from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockAgreement, getMockEservice } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Agreement } from "../../../../packages/models/agreement-models/src/agreement.ts";

import { type API_AgreementSeed } from "../src/models/agreement/api.ts";
import { toK2KAgreement } from "./k2kConverters.ts";
import { remoteResourceDbService } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

const createAgreementMock = vi.hoisted(() => vi.fn());
const getAgreementMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      createAgreement: createAgreementMock,
      getAgreement: getAgreementMock,
    },
  };
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /agreements (createAgreement)", () => {
  const eservice = getMockEservice({ latestVersionState: "Active" });
  const k2kBody: k2kGatewayApi.AgreementSeed = {
    consumerId: generateId(),
    eserviceId: eservice.id,
    eserviceVersionId: eservice.versions[0]!.id,
  };
  const body: API_AgreementSeed = {
    ...k2kBody,
    knodeId: "Orion",
  };

  const agreement: Agreement = {
    ...getMockAgreement(),
    consumer: {
      id: unsafeBrandId(body.consumerId),
      knodeId: KnodeId.parse(body.knodeId),
    },
    eserviceId: unsafeBrandId(body.eserviceId),
    eserviceVersionId: unsafeBrandId(body.eserviceVersionId),
  };
  const mockK2KResponse: API_CreatedResource = {
    id: agreement.id,
  };

  beforeEach(() => {
    createAgreementMock.mockReset();
    getAgreementMock.mockReset();
  });

  it("should return 201 with converted results on success", async () => {
    createAgreementMock.mockResolvedValue({
      data: mockK2KResponse,
    });
    getAgreementMock.mockResolvedValue({
      data: toK2KAgreement(agreement),
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/agreements")
      .body(body);

    expect(response.statusCode).toBe(201);

    expect(createAgreementMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: k2kBody,
      }),
    );

    expect(response.json()).toEqual(mockK2KResponse);

    const remoteResourceAgreement =
      await remoteResourceDbService.getByAgreementId(
        agreement.id,
        KnodeId.parse(body.knodeId),
      );
    const expectedRemoteResourceAgreement: RemoteResourceAgreementSQL = {
      agreementId: agreement.id,
      consumerId: agreement.consumer.id,
      eserviceId: agreement.eserviceId,
      eserviceVersionId: agreement.eserviceVersionId,
      knodeId: body.knodeId,
      producerId: agreement.producerId,
    };

    expect(remoteResourceAgreement).toEqual(expectedRemoteResourceAgreement);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post("/agreements")
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
      body: { ...body, eserviceVersionId: 99 },
    },
    { body: { ...body, eserviceVersionId: "" } },
    {
      body: { ...body, consumerId: 99 },
    },
    {
      body: { ...body, consumerId: "" },
    },
  ])(
    "should return 400 if query/body parameters are formatted incorrectly (%o)",
    async ({ body }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/agreements")
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );
});
