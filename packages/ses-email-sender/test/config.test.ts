import { describe, expect, it } from "vitest";

import { SesEmailSenderConfig } from "../src/config.ts";

describe("SesEmailSenderConfig", () => {
  const base = {
    AWS_REGION: "eu-south-1",
    SES_SENDER_MAIL: "noreply@knodia.example",
  };

  it("maps SES_CONFIGURATION_SET when provided (TC-S-2-01)", () => {
    const config = SesEmailSenderConfig.parse({
      ...base,
      SES_CONFIGURATION_SET: "knodia-signup",
    });
    expect(config.sesConfigurationSet).toBe("knodia-signup");
  });

  it("leaves the configuration set undefined when omitted (TC-S-2-02)", () => {
    const config = SesEmailSenderConfig.parse(base);
    expect(config.sesConfigurationSet).toBeUndefined();
  });
});
