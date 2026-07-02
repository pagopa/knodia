import { setupSesTestStore } from "@knodia/test-commons/ses";
import { afterEach, beforeAll, inject } from "vitest";

import type { SesEmailSenderConfig } from "../src/config.ts";

import { initEmailSender } from "../src/emailSender.ts";

export const config: SesEmailSenderConfig = {
  awsRegion: "eu-south-1",
  sesConfigurationSet: "knodia-test",
  sesSenderLabel: "KNODIA",
  sesSenderMail: "noreply@knodia.example",
};

export let emailSender: ReturnType<typeof initEmailSender>;
export let getSentEmails: ReturnType<typeof setupSesTestStore>["getSentEmails"];
let cleanAfterEach: () => Promise<void>;

beforeAll(() => {
  const store = setupSesTestStore(inject("SES_CONNECTION_STRING"));
  emailSender = initEmailSender(config, store.sesClient);
  getSentEmails = store.getSentEmails;
  cleanAfterEach = store.cleanAfterEach;
});

afterEach(async () => {
  await cleanAfterEach();
});
