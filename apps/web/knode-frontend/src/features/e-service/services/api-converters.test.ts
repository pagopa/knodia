import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

import {
  toConsumptionEserviceDetail,
  toEserviceFromScratchSeed,
} from "./api-converters";

const TEST_CHECKSUM =
  "80bb7a41804be0601bbff2f0019045657757c29e5995e8eb221317cf757ba89e";

function createBffDetail(
  overrides?: Partial<bffApi.ConsumerEserviceDetails>,
): bffApi.ConsumerEserviceDetails {
  return {
    accessToken: {
      audience: ["https://api.example.com"],
      duration: 3600,
      type: "Bearer",
    },
    categories: [{ code: "birth-place", scheme: "eu-categories" }],
    description: { en: "Test description" },
    hasRecentlyBeenUpdated: false,
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    identificationRequired: false,
    interfaceDocument: {
      checksum: "abc123",
      name: "API Specs",
    },
    isSignalHubEnabled: false,
    latestVersionId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    latestVersionUpdatedAt: "2026-04-30T10:00:00.000Z",
    maxDailyCalls: {
      perConsumer: 1000,
      perKnode: 10000,
    },
    mode: "ProvideData",
    name: { en: "Test E-Service" },
    producer: {
      email: "info@ursa.com",
      id: "00000000-0000-4000-8000-000000000099",
      knodeId: "Lynx",
      name: "Ursa Major",
      notes: "Open Mon-Fri",
    },
    requiredAttributes: [[{ code: "NUTS3", possessed: true, scheme: "eu" }]],
    state: "Active",
    ...overrides,
  };
}

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

describe("toConsumptionEserviceDetail", () => {
  it("flattens localized name and description to .en", () => {
    const result = toConsumptionEserviceDetail(createBffDetail());

    expect(result.name).toBe("Test E-Service");
    expect(result.description).toBe("Test description");
  });

  it("converts accessToken duration from seconds to minutes", () => {
    const result = toConsumptionEserviceDetail(
      createBffDetail({
        accessToken: { audience: [], duration: 5400, type: "Bearer" },
      }),
    );

    expect(result.accessToken.durationInMinutes).toBe(90);
  });

  it("floors accessToken duration for non-exact minute values", () => {
    const result = toConsumptionEserviceDetail(
      createBffDetail({
        accessToken: { audience: [], duration: 125, type: "Bearer" },
      }),
    );

    expect(result.accessToken.durationInMinutes).toBe(2);
  });

  it("passes accessToken audience as array", () => {
    const result = toConsumptionEserviceDetail(
      createBffDetail({
        accessToken: {
          audience: ["aud1", "aud2"],
          duration: 3600,
          type: "DPoP",
        },
      }),
    );

    expect(result.accessToken.audience).toEqual(["aud1", "aud2"]);
    expect(result.accessToken.type).toBe("DPoP");
  });

  it("maps producer knodeId and name", () => {
    const result = toConsumptionEserviceDetail(createBffDetail());

    expect(result.producer.knodeId).toBe("Lynx");
    expect(result.producer.name).toBe("Ursa Major");
  });

  it("brands the eservice id", () => {
    const result = toConsumptionEserviceDetail(createBffDetail());

    expect(result.id).toBe("f47ac10b-58cc-4372-a567-0e02b2c3d479");
  });

  it("brands the latestVersionId", () => {
    const result = toConsumptionEserviceDetail(createBffDetail());

    expect(result.latestVersionId).toBe("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
  });

  it("passes through fields unchanged", () => {
    const result = toConsumptionEserviceDetail(createBffDetail());

    expect(result.categories).toEqual([
      { code: "birth-place", scheme: "eu-categories" },
    ]);
    expect(result.identificationRequired).toBe(false);
    expect(result.interfaceDocument).toEqual({
      checksum: "abc123",
      name: "API Specs",
    });
    expect(result.isSignalHubEnabled).toBe(false);
    expect(result.maxDailyCalls).toEqual({
      perConsumer: 1000,
      perKnode: 10000,
    });
    expect(result.mode).toBe("ProvideData");
    expect(result.producer.knodeId).toBe("Lynx");
    expect(result.producer.name).toBe("Ursa Major");
    expect(result.requiredAttributes).toEqual([
      [{ code: "NUTS3", possessed: true, scheme: "eu" }],
    ]);
    expect(result.state).toBe("Active");
  });

  it("passes through agreement when present", () => {
    const agreement = {
      id: crypto.randomUUID(),
      state: "Active" as const,
      suspendedByConsumerAt: null,
      suspendedByProducerAt: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const result = toConsumptionEserviceDetail(createBffDetail({ agreement }));

    expect(result.agreement).toEqual(agreement);
  });

  it("sets agreement to undefined when absent", () => {
    const result = toConsumptionEserviceDetail(createBffDetail());

    expect(result.agreement).toBeUndefined();
  });
});

describe("toEserviceFromScratchSeed", () => {
  it("wraps name and description in localized objects", async () => {
    const body = await toEserviceFromScratchSeed(
      createFormData(),
      TEST_CHECKSUM,
    );

    expect(body.name).toEqual({ en: "Test E-Service" });
    expect(body.description).toEqual({ en: "Test description" });
  });

  it("wraps accessTokenAudience in an array", async () => {
    const body = await toEserviceFromScratchSeed(
      createFormData(),
      TEST_CHECKSUM,
    );

    expect(body.accessTokenAudience).toEqual(["https://api.example.com"]);
  });

  it("base64-encodes file content", async () => {
    const body = await toEserviceFromScratchSeed(
      createFormData(),
      TEST_CHECKSUM,
    );

    // '{"openapi":"3.0.0"}' → base64
    expect(body.interfaceDocument.content).toBe(btoa('{"openapi":"3.0.0"}'));
  });

  it("sets interfaceDocument metadata correctly", async () => {
    const body = await toEserviceFromScratchSeed(
      createFormData(),
      TEST_CHECKSUM,
    );

    expect(body.interfaceDocument.name).toBe("spec.json");
    expect(body.interfaceDocument.contentType).toBe("application/json");
    expect(body.interfaceDocument.prettyName).toEqual({ en: "spec.json" });
    expect(body.interfaceDocument.checksum).toBe(TEST_CHECKSUM);
  });

  it("falls back to extension-based content type when file.type is empty", async () => {
    const yamlFile = new File(["openapi: 3.0.0"], "spec.yaml", { type: "" });
    const body = await toEserviceFromScratchSeed(
      createFormData({ interfaceDocument: yamlFile }),
      TEST_CHECKSUM,
    );

    expect(body.interfaceDocument.contentType).toBe("application/yaml");
  });

  it("converts accessTokenDuration from minutes to seconds", async () => {
    const body = await toEserviceFromScratchSeed(
      createFormData(),
      TEST_CHECKSUM,
    );

    expect(body.accessTokenDuration).toBe(60 * 60);
  });

  it("passes through scalar fields unchanged", async () => {
    const body = await toEserviceFromScratchSeed(
      createFormData(),
      TEST_CHECKSUM,
    );

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
