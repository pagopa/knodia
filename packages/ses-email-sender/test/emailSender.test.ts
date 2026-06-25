import {
  clearSesStore,
  createTestSesClient,
  getSentEmails,
} from "@knodia/test-commons/ses";
import { beforeAll, beforeEach, describe, expect, inject, it } from "vitest";

import type { SesEmailSenderConfig } from "../src/config.ts";

import { initEmailSender } from "../src/emailSender.ts";

const config: SesEmailSenderConfig = {
  awsRegion: "eu-south-1",
  sesSenderLabel: "KNODIA",
  sesSenderMail: "noreply@knodia.example",
};

let sesEndpoint: string;

beforeAll(() => {
  sesEndpoint = inject("SES_CONNECTION_STRING");
});

beforeEach(async () => {
  await clearSesStore(sesEndpoint);
});

describe("initEmailSender", () => {
  it("the mock store starts empty after a clear (TC-S-1-01)", async () => {
    expect(await getSentEmails(sesEndpoint)).toHaveLength(0);
  });

  it("sends an email with a CSV attachment to the store (TC-S-1-02)", async () => {
    const emailSender = initEmailSender(
      config,
      createTestSesClient(sesEndpoint),
    );

    await emailSender.sendEmail({
      attachments: [
        {
          content: "a;b\r\n1;2\r\n",
          contentType: "text/csv; charset=utf-8",
          filename: "report.csv",
        },
      ],
      body: "corpo di prova",
      subject: "Oggetto di prova",
      to: "dpo@knodia.example",
    });

    const emails = await getSentEmails(sesEndpoint);
    expect(emails).toHaveLength(1);

    const email = emails.at(0);
    expect(email?.subject).toBe("Oggetto di prova");
    expect(email?.from).toContain("noreply@knodia.example");
    expect(email?.from).toContain("KNODIA");
    expect(JSON.stringify(email?.destination)).toContain("dpo@knodia.example");

    expect(email?.attachments).toHaveLength(1);
    const attachment = email?.attachments.at(0);
    expect(attachment?.filename).toBe("report.csv");
    expect(attachment?.contentType).toContain("csv");
  });

  it("rejects when SES is unreachable (TC-F-1-01)", async () => {
    const emailSender = initEmailSender(
      config,
      createTestSesClient("http://localhost:1"),
    );

    await expect(
      emailSender.sendEmail({
        body: "x",
        subject: "x",
        to: "dpo@knodia.example",
      }),
    ).rejects.toThrow();
  });
});
