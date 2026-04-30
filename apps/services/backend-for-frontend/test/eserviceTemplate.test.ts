import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

import { applyInterfaceDocumentOverrides } from "../src/utils/eserviceTemplate.ts";

const overrides = {
  contact: {
    email: "api@example.com",
    name: "API Team",
    url: "https://example.com/support",
  },
  serverUrls: ["https://api.example.com", "https://api-backup.example.com"],
  termsOfService: "https://example.com/terms",
};

const overridesWithoutTermsOfService = {
  ...overrides,
  termsOfService: undefined,
};

describe("applyInterfaceDocumentOverrides", () => {
  it("applies overrides to a JSON interface document", () => {
    const content = Buffer.from(
      JSON.stringify({
        info: {
          contact: {
            email: "old@example.com",
            name: "Old Team",
          },
          termsOfService: "https://old.example.com/terms",
          title: "Template API",
          version: "1.0.0",
        },
        openapi: "3.1.0",
        servers: [{ url: "https://old.example.com" }],
      }),
      "utf8",
    );

    const result = applyInterfaceDocumentOverrides({
      content,
      fileName: "openapi.json",
      overrides,
    });

    const parsed = JSON.parse(result.toString("utf8"));

    expect(parsed.info.contact).toEqual(overrides.contact);
    expect(parsed.info.termsOfService).toBe(overrides.termsOfService);
    expect(parsed.info.title).toBe("Template API");
    expect(parsed.info.version).toBe("1.0.0");
    expect(parsed.openapi).toBe("3.1.0");
    expect(parsed.servers).toEqual(
      overrides.serverUrls.map((url) => ({ url })),
    );
  });

  it.each(["openapi.yaml", "openapi.yml", "OPENAPI.YML"])(
    "applies overrides to a YAML interface document (%s)",
    (fileName) => {
      const content = Buffer.from(
        `
openapi: 3.1.0
info:
  title: Template API
  version: 1.0.0
  termsOfService: https://old.example.com/terms
  contact:
    name: Old Team
    email: old@example.com
servers:
  - url: https://old.example.com
`,
        "utf8",
      );

      const result = applyInterfaceDocumentOverrides({
        content,
        fileName,
        overrides,
      });

      const parsed = yaml.load(result.toString("utf8")) as {
        info: Record<string, unknown>;
        openapi: string;
        servers: { url: string }[];
      };

      expect(parsed.info["contact"]).toEqual(overrides.contact);
      expect(parsed.info["termsOfService"]).toBe(overrides.termsOfService);
      expect(parsed.info["title"]).toBe("Template API");
      expect(parsed.info["version"]).toBe("1.0.0");
      expect(parsed.openapi).toBe("3.1.0");
      expect(parsed.servers).toEqual(
        overrides.serverUrls.map((url) => ({ url })),
      );
    },
  );

  it("creates missing info and servers sections before applying overrides", () => {
    const result = applyInterfaceDocumentOverrides({
      content: Buffer.from(JSON.stringify({ openapi: "3.1.0" }), "utf8"),
      fileName: "openapi.json",
      overrides,
    });

    expect(JSON.parse(result.toString("utf8"))).toEqual({
      info: {
        contact: overrides.contact,
        termsOfService: overrides.termsOfService,
      },
      openapi: "3.1.0",
      servers: overrides.serverUrls.map((url) => ({ url })),
    });
  });

  it("removes termsOfService when the override is undefined", () => {
    const result = applyInterfaceDocumentOverrides({
      content: Buffer.from(
        JSON.stringify({
          info: {
            termsOfService: "https://old.example.com/terms",
          },
          openapi: "3.1.0",
        }),
        "utf8",
      ),
      fileName: "openapi.json",
      overrides: overridesWithoutTermsOfService,
    });

    expect(JSON.parse(result.toString("utf8"))).toEqual({
      info: {
        contact: overrides.contact,
      },
      openapi: "3.1.0",
      servers: overrides.serverUrls.map((url) => ({ url })),
    });
  });

  it.each([
    ["JSON root is null", "openapi.json", "null"],
    ["JSON root is an array", "openapi.json", "[]"],
    ["YAML root is a scalar", "openapi.yaml", "hello"],
  ])("rejects documents when %s", (_label, fileName, rawContent) => {
    expect(() =>
      applyInterfaceDocumentOverrides({
        content: Buffer.from(rawContent, "utf8"),
        fileName,
        overrides,
      }),
    ).toThrow("Failed to apply interface document overrides");
  });

  it.each([
    ["openapi.json", "{"],
    ["openapi.yaml", "openapi: ["],
  ])("rejects malformed %s documents", (fileName, rawContent) => {
    expect(() =>
      applyInterfaceDocumentOverrides({
        content: Buffer.from(rawContent, "utf8"),
        fileName,
        overrides,
      }),
    ).toThrow("Failed to apply interface document overrides");
  });

  it("rejects unsupported interface document file types", () => {
    expect(() =>
      applyInterfaceDocumentOverrides({
        content: Buffer.from("openapi: 3.1.0", "utf8"),
        fileName: "openapi.txt",
        overrides,
      }),
    ).toThrow("Unsupported interface file type: openapi.txt");
  });
});
