/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Agreement } from "@knodia/agreement-models";
import type { RemoteResourceAgreementSQL } from "@knodia/db-remote-resource";

import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import {
  generateId,
  KnodeId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockAgreement,
  getMockEservice,
  getMockOrganization,
} from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type API_AgreementSeed,
  type API_CreatedAgreementResource,
} from "../../src/models/agreement/api.ts";
import { toK2KAgreement } from "../k2kConverters.ts";
import { remoteResourceDbService } from "../setup.ts";
import { injectAppRequest } from "../utils.ts";

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
  const testOrganization = getMockOrganization();
  const body: API_AgreementSeed = {
    eserviceId: eservice.id,
    eserviceVersionId: eservice.versions[0]!.id,
    knodeId: "Orion",
  };

  const agreement: Agreement = {
    ...getMockAgreement(),
    consumer: {
      id: unsafeBrandExternalId(TEST_ORGANIZATION_ID),
      knodeId: KnodeId.parse(body.knodeId),
    },
    eserviceId: unsafeBrandId(body.eserviceId),
    eserviceVersionId: unsafeBrandId(body.eserviceVersionId),
  };
  const mockK2KResponse: API_CreatedAgreementResource = {
    id: agreement.id,
    producerId: agreement.producerId,
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
        body: expect.objectContaining({
          consumerAttributes: testOrganization.attributes,
          consumerId: TEST_ORGANIZATION_ID,
          eserviceId: body.eserviceId,
          eserviceVersionId: body.eserviceVersionId,
        }),
      }),
    );

    expect(response.json()).toEqual(mockK2KResponse);

    const remoteResourceAgreement =
      await remoteResourceDbService.getAgreementById(
        unsafeBrandExternalId(agreement.id),
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
    { body: { ...body, wrongProperty: "wrong" } },
    { body: { ...body, eserviceId: 99 } },
    { body: { ...body, eserviceId: "" } },
    { body: { ...body, eserviceVersionId: 99 } },
    { body: { ...body, eserviceVersionId: "" } },
    { body: { ...body, consumerId: 99 } },
    { body: { ...body, consumerId: "" } },
  ])(
    "should return 400 if query/body parameters are formatted incorrectly (%o)",
    async ({ body }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/agreements")
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
      .post("/agreements")
      .body(body);
    expect(response.statusCode).toBe(403);
  });
});
