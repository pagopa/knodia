/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { API_CreatedResource } from "@knodia/common-models/api";
import { generateId } from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockEservice } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zocker } from "zocker";

import { type API_AgreementSeed } from "../src/models/agreement/api.ts";
import { injectAppRequest } from "./utils.ts";

const createAgreementMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      createAgreement: createAgreementMock,
    },
  };
});

const toK2KResult = (
  apiResult: API_CreatedResource,
): k2kGatewayApi.CreatedResource => ({
  id: apiResult.id,
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

  const expectedApiResult = zocker(API_CreatedResource).generate();
  const mockK2KResponse = toK2KResult(expectedApiResult);

  beforeEach(() => {
    createAgreementMock.mockReset();
  });

  it("should return 201 with converted results on success", async () => {
    createAgreementMock.mockResolvedValue({
      data: mockK2KResponse,
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

    expect(response.json()).toEqual(expectedApiResult);
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
