import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import { type EmailSender } from "@knodia/ses-email-sender";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { type Logger } from "pino";

import {
  buildSuspendedUsersCsv,
  buildSuspendedUsersEmailBody,
  romeDateStamp,
} from "./suspendedUsersEmail.ts";

export type NotifierService = ReturnType<typeof notifierServiceBuilder>;

export function notifierServiceBuilder(
  signupDb: NodePgDatabase,
  emailSender: EmailSender,
  logger: Logger,
) {
  const signupDbService = signupDbServiceBuilder(signupDb);

  return {
    async run({
      recipient,
      subject,
    }: {
      recipient: string;
      subject: string;
    }): Promise<void> {
      logger.info("Suspended-users notification job started");

      const suspended = await signupDbService.listSuspendedSignupUsers();

      // Empty list → do not send (KN-802 redundancy applies only when there is
      // something to report).
      if (suspended.length === 0) {
        logger.info("No suspended users found, skipping email");
        return;
      }

      const now = new Date();
      await emailSender.sendEmail({
        attachments: [
          {
            content: buildSuspendedUsersCsv(suspended),
            contentType: "text/csv; charset=utf-8",
            filename: `utenti-sospesi-${romeDateStamp(now)}.csv`,
          },
        ],
        body: buildSuspendedUsersEmailBody(suspended.length, now),
        subject,
        to: recipient,
      });

      // Log a count only — never PII or the email content.
      logger.info(
        `Suspended-users notification sent for ${suspended.length} user(s)`,
      );
    },
  };
}
