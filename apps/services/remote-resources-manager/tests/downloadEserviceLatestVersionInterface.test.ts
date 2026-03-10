/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const getEserviceLatestVersionInterfaceMock = vi.hoisted(() => vi.fn());
const downloadEserviceLatestVersionInterfaceMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      downloadEserviceLatestVersionInterface:
        downloadEserviceLatestVersionInterfaceMock,
      getEserviceLatestVersionInterface: getEserviceLatestVersionInterfaceMock,
    },
  };
});

const mockMetadata: k2kGatewayApi.EserviceVersionInterfaceDocument = {
  checksum: "abc123",
  contentType: "application/yaml",
  id: crypto.randomUUID(),
  name: "openapi.yaml",
  prettyName: { en: "OpenAPI Specification" },
  updatedAt: new Date().toISOString(),
};

const mockFileContent = "openapi: 3.0.0\ninfo:\n  title: Test API";
const mockBlob = Buffer.from(mockFileContent);

describe("GET /eservices/:eserviceId/interface (downloadEserviceLatestVersionInterface)", () => {
  const eserviceId = crypto.randomUUID();
  const knodeId = "Orion";

  beforeEach(() => {
    getEserviceLatestVersionInterfaceMock.mockReset();
    downloadEserviceLatestVersionInterfaceMock.mockReset();
  });

  it("should return 200 with correct headers and file content on success", async () => {
    getEserviceLatestVersionInterfaceMock.mockResolvedValue({
      data: mockMetadata,
    });
    downloadEserviceLatestVersionInterfaceMock.mockResolvedValue({
      data: mockBlob,
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/eservices/${eserviceId}/interface`)
      .query({ knodeId });

    expect(response.statusCode).toBe(200);

    expect(response.headers["content-type"]).toBe("application/yaml");
    expect(response.headers["content-disposition"]).toBe(
      `attachment; filename="${mockMetadata.name}"`,
    );
    expect(response.body).toBe(mockFileContent);

    const expectedPath = { eserviceId };

    expect(getEserviceLatestVersionInterfaceMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: expectedPath }),
    );
    expect(downloadEserviceLatestVersionInterfaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expectedPath,
        responseType: "arraybuffer",
      }),
    );
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .get(`/eservices/${eserviceId}/interface`)
        .query({ knodeId });
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { eserviceId: "not-a-uuid", query: { knodeId: "Orion" } },
    { eserviceId: crypto.randomUUID(), query: {} },
    { eserviceId: crypto.randomUUID(), query: { knodeId: "InvalidKnode" } },
  ])(
    "should return 400 if parameters are formatted incorrectly (%o)",
    async ({ eserviceId, query }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get(`/eservices/${eserviceId}/interface`)
        .query(query as never);

      expect(response.statusCode).toBe(400);
    },
  );
});
