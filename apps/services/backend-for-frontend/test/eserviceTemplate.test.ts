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

    expect(JSON.parse(result.toString("utf8"))).toMatchObject({
      info: {
        contact: overrides.contact,
        termsOfService: overrides.termsOfService,
        title: "Template API",
        version: "1.0.0",
      },
      openapi: "3.1.0",
      servers: overrides.serverUrls.map((url) => ({ url })),
    });
  });

  it("applies overrides to a YAML interface document", () => {
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
      fileName: "openapi.yaml",
      overrides,
    });

    expect(yaml.load(result.toString("utf8"))).toMatchObject({
      info: {
        contact: overrides.contact,
        termsOfService: overrides.termsOfService,
        title: "Template API",
        version: "1.0.0",
      },
      openapi: "3.1.0",
      servers: overrides.serverUrls.map((url) => ({ url })),
    });
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
