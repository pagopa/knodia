import type { SesEmailSenderConfig } from "@knodia/ses-email-sender/config";
import type { TestDrizzleDb } from "@knodia/test-commons/types";

import { signupUser } from "@knodia/db-signup";
import {
  type SignupDbService,
  signupDbServiceBuilder,
} from "@knodia/db-signup/services";
import { initEmailSender } from "@knodia/ses-email-sender";
import { setupSesTestStore } from "@knodia/test-commons/ses";
import { setupSignupTestDatabase } from "@knodia/test-commons/signupDb";
import {
  createTestLogger,
  resetTestDatabase,
} from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, beforeEach, inject } from "vitest";

import {
  type NotifierService,
  notifierServiceBuilder,
} from "../src/services/notifierService.ts";

export const sesConfig: SesEmailSenderConfig = {
  awsRegion: "eu-south-1",
  sesSenderLabel: "KNODIA",
  sesSenderMail: "noreply@knodia.test",
};

export let signupDb: TestDrizzleDb;
export let signupDbService: SignupDbService;
export let notifierService: NotifierService;
export let getSentEmails: ReturnType<typeof setupSesTestStore>["getSentEmails"];
let clearSesStore: () => Promise<void>;

beforeAll(async () => {
  signupDb = await setupSignupTestDatabase(
    inject("POSTGRES_CONNECTION_STRING"),
  );
  signupDbService = signupDbServiceBuilder(signupDb);

  const ses = setupSesTestStore(inject("SES_CONNECTION_STRING"));
  getSentEmails = ses.getSentEmails;
  clearSesStore = ses.cleanAfterEach;

  notifierService = notifierServiceBuilder(
    signupDbService,
    initEmailSender(sesConfig, ses.sesClient),
    createTestLogger().logger,
  );
});

beforeEach(async () => {
  await clearSesStore();
});

afterEach(async () => {
  await resetTestDatabase(signupDb, signupUser);
});

afterAll(async () => {
  await signupDb.$client.end();
});
