import type { SesEmailSenderConfig } from "@knodia/ses-email-sender/config";
import type { TestDrizzleDb } from "@knodia/test-commons/types";

import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { signupUser } from "@knodia/db-signup";
import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import { initEmailSender } from "@knodia/ses-email-sender";
import {
  SignupUser,
  SignupUserStatus,
  SuspensionReason,
} from "@knodia/signup-models";
import {
  clearSesStore,
  createTestSesClient,
  getSentEmails,
} from "@knodia/test-commons/ses";
import { setupSignupTestDatabase } from "@knodia/test-commons/signupDb";
import {
  createTestLogger,
  resetTestDatabase,
} from "@knodia/test-commons/utils";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  inject,
  it,
} from "vitest";

import {
  type NotifierService,
  notifierServiceBuilder,
} from "../src/services/notifierService.ts";

const RECIPIENT = "dpo@pagopa.it";
const SUBJECT = "KNODIA: Request for application of Right to Restriction";

const sesConfig: SesEmailSenderConfig = {
  awsRegion: "eu-south-1",
  sesSenderLabel: "KNODIA",
  sesSenderMail: "noreply@knodia.test",
};

let db: TestDrizzleDb;
let dbService: ReturnType<typeof signupDbServiceBuilder>;
let sesEndpoint: string;
let notifierService: NotifierService;

beforeAll(async () => {
  db = await setupSignupTestDatabase(inject("POSTGRES_CONNECTION_STRING"));
  dbService = signupDbServiceBuilder(db);
  sesEndpoint = inject("SES_CONNECTION_STRING");
  const emailSender = initEmailSender(
    sesConfig,
    createTestSesClient(sesEndpoint),
  );
  notifierService = notifierServiceBuilder(
    db,
    emailSender,
    createTestLogger().logger,
  );
});

beforeEach(async () => {
  await clearSesStore(sesEndpoint);
});

afterEach(async () => {
  await resetTestDatabase(db, signupUser);
});

afterAll(async () => {
  await db.$client.end();
});

function makeSuspended(
  suspendedAt: Date,
  overrides: Record<string, unknown> = {},
): SignupUser {
  return makeUser({
    status: SignupUserStatus.enum.Suspended,
    suspendedAt,
    suspensionReason: SuspensionReason.enum.AccuracyContested,
    ...overrides,
  });
}

function makeUser(overrides: Record<string, unknown> = {}): SignupUser {
  const id = generateId<SignupUserId>();
  return SignupUser.parse({
    createdAt: new Date("2026-01-01T00:00:00Z"),
    dateOfBirth: "1980-01-15",
    email: `${id}@example.test`,
    familyName: "Rossi",
    fiscalNumber: `FN-${id}`,
    generatedEntities: {
      Lynx: { organizationName: `Lynx ${id}`, userName: `lynx_${id}` },
      Orion: { organizationName: `Orion ${id}`, userName: `orion_${id}` },
    },
    name: "Mario",
    signupUserId: id,
    status: SignupUserStatus.enum.Active,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  });
}

describe("suspended-users notifier", () => {
  it("sends one email with a CSV of the Suspended users, ordered desc", async () => {
    const oldest = makeSuspended(new Date("2026-02-01T10:00:00Z"), {
      fiscalNumber: undefined,
      spidCode: `SPID-${generateId()}`,
    });
    const middle = makeSuspended(new Date("2026-03-01T10:00:00Z"), {
      fiscalNumber: undefined,
      personIdentifier: `PID-${generateId()}`,
    });
    const newest = makeSuspended(new Date("2026-04-01T10:00:00Z"));
    const active = makeUser({ status: SignupUserStatus.enum.Active });
    const deletionPending = makeUser({
      status: SignupUserStatus.enum.DeletionPending,
    });

    for (const u of [oldest, active, middle, deletionPending, newest]) {
      await dbService.insertSignupUser(u);
    }

    await notifierService.run({ recipient: RECIPIENT, subject: SUBJECT });

    const emails = await getSentEmails(sesEndpoint);
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
    await dbService.insertSignupUser(
      makeUser({ status: SignupUserStatus.enum.Active }),
    );

    await notifierService.run({ recipient: RECIPIENT, subject: SUBJECT });

    await expect(getSentEmails(sesEndpoint)).resolves.toHaveLength(0);
  });

  it("rejects when SES is unreachable", async () => {
    await dbService.insertSignupUser(
      makeSuspended(new Date("2026-04-01T10:00:00Z")),
    );
    const failing = notifierServiceBuilder(
      db,
      initEmailSender(sesConfig, createTestSesClient("http://localhost:1")),
      createTestLogger().logger,
    );

    await expect(
      failing.run({ recipient: RECIPIENT, subject: SUBJECT }),
    ).rejects.toThrow();
  });
});
