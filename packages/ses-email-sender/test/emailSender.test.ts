import { setupSesTestStore } from "@knodia/test-commons/ses";
import { describe, expect, it } from "vitest";

import { initEmailSender } from "../src/emailSender.ts";
import { config, emailSender, getSentEmails } from "./setup.ts";

describe("initEmailSender", () => {
  it("the mock store starts empty after a clear (TC-S-1-01)", async () => {
    expect(await getSentEmails()).toHaveLength(0);
  });

  it("sends an email with a CSV attachment to the store (TC-S-1-02)", async () => {
    const csvContent = "a;b\r\n1;2\r\n";
    await emailSender.sendEmail({
      attachments: [
        {
          content: csvContent,
          contentType: "text/csv; charset=utf-8",
          filename: "report.csv",
        },
      ],
      body: "corpo di prova",
      subject: "Oggetto di prova",
      to: "dpo@knodia.example",
    });

    const emails = await getSentEmails();
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
    // Content survives the MIME encode/decode round-trip intact.
    expect(
      Buffer.from(attachment?.content ?? "", "base64").toString("utf8"),
    ).toBe(csvContent);
  });

  it("rejects when SES is unreachable (TC-F-1-01)", async () => {
    const failing = initEmailSender(
      config,
      setupSesTestStore("http://localhost:1").sesClient,
    );

    await expect(
      failing.sendEmail({
        body: "x",
        subject: "x",
        to: "dpo@knodia.example",
      }),
    ).rejects.toThrow();
  });
});
