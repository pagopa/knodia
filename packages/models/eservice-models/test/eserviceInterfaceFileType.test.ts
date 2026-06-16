import { describe, expect, it } from "vitest";

import { getEserviceInterfaceFileType } from "../src/eservice.ts";

describe("getEserviceInterfaceFileType", () => {
  it("recognizes the supported REST OpenAPI extensions", () => {
    expect(getEserviceInterfaceFileType("openapi.json")).toBe("json");
    expect(getEserviceInterfaceFileType("openapi.yaml")).toBe("yaml");
    expect(getEserviceInterfaceFileType("openapi.yml")).toBe("yml");
  });

  it("is case-insensitive on the extension", () => {
    expect(getEserviceInterfaceFileType("OPENAPI.JSON")).toBe("json");
    expect(getEserviceInterfaceFileType("spec.YaMl")).toBe("yaml");
  });

  it("returns undefined for unsupported or missing extensions", () => {
    expect(getEserviceInterfaceFileType("malicious.exe")).toBeUndefined();
    expect(getEserviceInterfaceFileType("spec.txt")).toBeUndefined();
    expect(getEserviceInterfaceFileType("noextension")).toBeUndefined();
  });
});
