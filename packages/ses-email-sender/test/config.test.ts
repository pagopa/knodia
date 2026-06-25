import { describe, expect, it } from "vitest";

import { SesEmailSenderConfig } from "../src/config.ts";

describe("SesEmailSenderConfig", () => {
  it("maps required env vars into camelCase", () => {
    const config = SesEmailSenderConfig.parse({
      AWS_REGION: "eu-south-1",
      SES_SENDER_LABEL: "KNODIA",
      SES_SENDER_MAIL: "noreply@knodia.example",
    });

    expect(config).toEqual({
      awsRegion: "eu-south-1",
      sesSenderLabel: "KNODIA",
      sesSenderMail: "noreply@knodia.example",
    });
  });

  it("treats the sender label as optional", () => {
    const config = SesEmailSenderConfig.parse({
      AWS_REGION: "eu-south-1",
      SES_SENDER_MAIL: "noreply@knodia.example",
    });

    expect(config.sesSenderLabel).toBeUndefined();
  });

  it("rejects a missing region", () => {
    expect(() =>
      SesEmailSenderConfig.parse({ SES_SENDER_MAIL: "noreply@knodia.example" }),
    ).toThrow();
  });

  it("rejects an invalid sender email", () => {
    expect(() =>
      SesEmailSenderConfig.parse({
        AWS_REGION: "eu-south-1",
        SES_SENDER_MAIL: "not-an-email",
      }),
    ).toThrow();
  });
});
