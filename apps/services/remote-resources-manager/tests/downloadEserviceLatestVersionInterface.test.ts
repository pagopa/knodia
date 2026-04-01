/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

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
    },
  };
});

const mockFileName = "openapi.yaml";
const mockContentType = "application/yaml";
const mockFileContent = "openapi: 3.0.0\ninfo:\n  title: Test API";
const mockBlob = Buffer.from(mockFileContent);

describe("GET /eservices/:eserviceId/interface (downloadEserviceLatestVersionInterface)", () => {
  const eserviceId = crypto.randomUUID();
  const knodeId = "Orion";

  beforeEach(() => {
    downloadEserviceLatestVersionInterfaceMock.mockReset();
  });

  it("should return 200 with correct headers and file content on success", async () => {
    downloadEserviceLatestVersionInterfaceMock.mockResolvedValue({
      data: mockBlob,
      headers: {
        "content-disposition": `attachment; filename="${mockFileName}"`,
        "content-type": mockContentType,
      },
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/eservices/${eserviceId}/interface`)
      .query({ knodeId });

    expect(response.statusCode).toBe(200);

    expect(response.headers["content-type"]).toBe(mockContentType);
    expect(response.headers["content-disposition"]).toBe(
      `attachment; filename="${mockFileName}"`,
    );
    expect(response.body).toBe(mockFileContent);

    expect(downloadEserviceLatestVersionInterfaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { eserviceId },
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
