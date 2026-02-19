import { describe, expect, it } from "vitest";

import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

import { toEserviceSeed } from "./api-converters";

const TEST_CHECKSUM =
  "80bb7a41804be0601bbff2f0019045657757c29e5995e8eb221317cf757ba89e";

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

describe("toEserviceSeed", () => {
  it("wraps name and description in localized objects", async () => {
    const body = await toEserviceSeed(createFormData(), TEST_CHECKSUM);

    expect(body.name).toEqual({ en: "Test E-Service" });
    expect(body.description).toEqual({ en: "Test description" });
  });

  it("wraps accessTokenAudience in an array", async () => {
    const body = await toEserviceSeed(createFormData(), TEST_CHECKSUM);

    expect(body.accessTokenAudience).toEqual(["https://api.example.com"]);
  });

  it("base64-encodes file content", async () => {
    const body = await toEserviceSeed(createFormData(), TEST_CHECKSUM);

    // '{"openapi":"3.0.0"}' → base64
    expect(body.interfaceDocument.content).toBe(btoa('{"openapi":"3.0.0"}'));
  });

  it("sets interfaceDocument metadata correctly", async () => {
    const body = await toEserviceSeed(createFormData(), TEST_CHECKSUM);

    expect(body.interfaceDocument.name).toBe("spec.json");
    expect(body.interfaceDocument.contentType).toBe("application/json");
    expect(body.interfaceDocument.prettyName).toEqual({ en: "spec.json" });
  });

  it("falls back to extension-based content type when file.type is empty", async () => {
    const yamlFile = new File(["openapi: 3.0.0"], "spec.yaml", { type: "" });
    const body = await toEserviceSeed(
      createFormData({ interfaceDocument: yamlFile }),
      TEST_CHECKSUM,
    );

    expect(body.interfaceDocument.contentType).toBe("application/yaml");
  });

  it("passes through scalar fields unchanged", async () => {
    const body = await toEserviceSeed(createFormData(), TEST_CHECKSUM);

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
});
