import { describe, expect, it } from "vitest";

import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

import { buildRequestBody } from "./eserviceRequestBody";

function createFormData(
  overrides?: Partial<EServiceFormData>,
): EServiceFormData {
  return {
    accessTokenAudience: "https://api.example.com",
    accessTokenDuration: 60,
    accessTokenType: "Bearer",
    categories: [{ code: "test_category", scheme: "vc_example" }],
    description: "Test description",
    interfaceDocument: new File(['{"openapi":"3.0.0"}'], "spec.json", {
      type: "application/json",
    }),
    isSignalHubEnabled: false,
    maxDailyCallsPerConsumer: 100,
    maxDailyCallsPerKnode: 1000,
    mode: "ProvideData",
    name: "Test E-Service",
    requiredAttributes: [[{ code: "nuts1", scheme: "vc_territorial_units" }]],
    ...overrides,
  };
}

describe("buildRequestBody", () => {
  it("wraps name and description in localized objects", async () => {
    const body = await buildRequestBody(createFormData());

    expect(body.name).toEqual({ en: "Test E-Service" });
    expect(body.description).toEqual({ en: "Test description" });
  });

  it("wraps accessTokenAudience in an array", async () => {
    const body = await buildRequestBody(createFormData());

    expect(body.accessTokenAudience).toEqual(["https://api.example.com"]);
  });

  it("base64-encodes file content", async () => {
    const body = await buildRequestBody(createFormData());

    // '{"openapi":"3.0.0"}' → base64
    expect(body.interfaceDocument.content).toBe(btoa('{"openapi":"3.0.0"}'));
  });

  it("computes SHA-256 checksum as base64", async () => {
    const body = await buildRequestBody(createFormData());

    // Independently compute expected checksum
    const buffer = new TextEncoder().encode('{"openapi":"3.0.0"}');
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    const expected = btoa(
      Array.from(new Uint8Array(hash), (b) => String.fromCharCode(b)).join(""),
    );

    expect(body.interfaceDocument.checksum).toBe(expected);
  });

  it("sets interfaceDocument metadata correctly", async () => {
    const body = await buildRequestBody(createFormData());

    expect(body.interfaceDocument.name).toBe("spec.json");
    expect(body.interfaceDocument.contentType).toBe("application/json");
    expect(body.interfaceDocument.prettyName).toEqual({ en: "spec.json" });
  });

  it("falls back to extension-based content type when file.type is empty", async () => {
    const yamlFile = new File(["openapi: 3.0.0"], "spec.yaml", { type: "" });
    const body = await buildRequestBody(
      createFormData({ interfaceDocument: yamlFile }),
    );

    expect(body.interfaceDocument.contentType).toBe("application/x-yaml");
  });

  it("passes through scalar fields unchanged", async () => {
    const body = await buildRequestBody(createFormData());

    expect(body.accessTokenDuration).toBe(60);
    expect(body.accessTokenType).toBe("Bearer");
    expect(body.mode).toBe("ProvideData");
    expect(body.isSignalHubEnabled).toBe(false);
    expect(body.maxDailyCallsPerConsumer).toBe(100);
    expect(body.maxDailyCallsPerKnode).toBe(1000);
    expect(body.categories).toEqual([
      { code: "test_category", scheme: "vc_example" },
    ]);
    expect(body.requiredAttributes).toEqual([
      [{ code: "nuts1", scheme: "vc_territorial_units" }],
    ]);
  });

  it("throws when interfaceDocument is null", async () => {
    await expect(
      buildRequestBody(
        createFormData({ interfaceDocument: null as unknown as File }),
      ),
    ).rejects.toThrow("Interface document is required");
  });
});
