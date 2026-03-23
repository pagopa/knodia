/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { KnodeId } from "@knodia/common-models/ids";

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockOrganization } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toAPI_Organization } from "../src/models/organization/apiConverter.ts";
import { toK2KOrganization } from "./k2kConverters.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getOrganizationMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getOrganization: getOrganizationMock,
    },
  };
});

describe("GET /organizations/:organizationId (getOrganization)", () => {
  const knodeId: KnodeId = "Orion";

  const organization = getMockOrganization();
  const k2kOrganization = toK2KOrganization(organization);

  const expectedApiDetail = toAPI_Organization(organization);

  beforeEach(() => {
    getOrganizationMock.mockReset();
  });

  it("should return 200 with converted detail on success", async () => {
    getOrganizationMock.mockResolvedValue({ data: k2kOrganization });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/organizations/${organization.id}`)
      .query({ knodeId });

    expect(response.statusCode).toBe(200);

    expect(getOrganizationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { organizationId: organization.id },
      }),
    );

    expect(response.json()).toEqual(expectedApiDetail);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .get(`/organizations/${organization.id}`)
        .query({ knodeId });
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { organizationId: "not-a-uuid", query: { knodeId } },
    { organizationId: crypto.randomUUID(), query: {} },
    { organizationId: crypto.randomUUID(), query: { knodeId: "InvalidKnode" } },
  ])(
    "should return 400 if parameters are formatted incorrectly (%o)",
    async ({ organizationId, query }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get(`/organizations/${organizationId}`)
        .query(query as never);

      expect(response.statusCode).toBe(400);
    },
  );
});
