import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import { makeSignupDrizzleConnection } from "@knodia/db-signup/utils";
import { createLogger } from "@knodia/logger";
import { initEmailSender } from "@knodia/ses-email-sender";

import { config } from "./config/config.ts";
import { notifierServiceBuilder } from "./services/notifierService.ts";

const logger = createLogger({ config });

const { db, pool } = makeSignupDrizzleConnection(config);
const signupDbService = signupDbServiceBuilder(db);
// No client passed: the endpoint resolves from aws.config.local in dev and from
// real SES in deployed environments.
const emailSender = initEmailSender(config);
const notifierService = notifierServiceBuilder(
  signupDbService,
  emailSender,
  logger,
);

const shutdown = async (reason: string, exitCode = 0) => {
  logger.info(`Shutting down (${reason})`);
  await pool.end();
  process.exit(exitCode);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

try {
  await notifierService.run({
    recipient: config.notificationRecipient,
    subject: config.notificationSubject,
  });
  await shutdown("Suspended-users notification finished", 0);
} catch (error) {
  logger.error({ err: error }, "Error during suspended-users notification");
  await shutdown("Suspended-users notification failed", 1);
}
