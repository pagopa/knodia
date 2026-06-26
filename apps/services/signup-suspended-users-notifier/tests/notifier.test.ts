import { generateId } from "@knodia/common-models/ids";
import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import { initEmailSender } from "@knodia/ses-email-sender";
import { SignupUserStatus } from "@knodia/signup-models";
import { setupSesTestStore } from "@knodia/test-commons/ses";
import { createTestLogger } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { notifierServiceBuilder } from "../src/services/notifierService.ts";
import {
  getSentEmails,
  notifierService,
  sesConfig,
  signupDb,
} from "./setup.ts";
import { seedSuspendedUser, seedUser } from "./utils.ts";

const RECIPIENT = "dpo@pagopa.it";
const SUBJECT = "Elenco utenti sospesi su Knodia";

describe("suspended-users notifier", () => {
  it("sends one email with a CSV of the Suspended users, ordered desc", async () => {
    const oldest = await seedSuspendedUser(new Date("2026-02-01T10:00:00Z"), {
      fiscalNumber: undefined,
      spidCode: `SPID-${generateId()}`,
    });
    const middle = await seedSuspendedUser(new Date("2026-03-01T10:00:00Z"), {
      fiscalNumber: undefined,
      personIdentifier: `PID-${generateId()}`,
    });
    const newest = await seedSuspendedUser(new Date("2026-04-01T10:00:00Z"));
    const active = await seedUser({ status: SignupUserStatus.enum.Active });
    const deletionPending = await seedUser({
      status: SignupUserStatus.enum.DeletionPending,
    });

    await notifierService.run({ recipient: RECIPIENT, subject: SUBJECT });

    const emails = await getSentEmails();
    expect(emails).toHaveLength(1);

    const email = emails.at(0);
    expect(JSON.stringify(email?.destination)).toContain(RECIPIENT);
    expect(email?.subject).toBe(SUBJECT);
    expect(email?.body.text).toContain("Utenti totali: 3");

    const attachment = email?.attachments.at(0);
    expect(attachment?.filename).toMatch(
      /^utenti-sospesi-\d{4}-\d{2}-\d{2}\.csv$/,
    );
    expect(attachment?.contentType).toContain("csv");

    const csv = Buffer.from(attachment?.content ?? "", "base64").toString(
      "utf8",
    );
    const dataRows = csv
      .replace(/^\uFEFF/, "")
      .trimEnd()
      .split("\r\n")
      .slice(1);
    expect(dataRows.map((r) => r.split(";")[0])).toEqual([
      newest.signupUserId,
      middle.signupUserId,
      oldest.signupUserId,
    ]);
    expect(csv).not.toContain(active.signupUserId);
    expect(csv).not.toContain(deletionPending.signupUserId);
  });

  it("does not send when there are no Suspended users", async () => {
    await seedUser({ status: SignupUserStatus.enum.Active });

    await notifierService.run({ recipient: RECIPIENT, subject: SUBJECT });

    await expect(getSentEmails()).resolves.toHaveLength(0);
  });

  it("rejects when SES is unreachable", async () => {
    await seedSuspendedUser(new Date("2026-04-01T10:00:00Z"));
    const failing = notifierServiceBuilder(
      signupDbServiceBuilder(signupDb),
      initEmailSender(
        sesConfig,
        setupSesTestStore("http://localhost:1").sesClient,
      ),
      createTestLogger().logger,
    );

    await expect(
      failing.run({ recipient: RECIPIENT, subject: SUBJECT }),
    ).rejects.toThrow();
  });
});
