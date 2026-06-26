import { type SignupDbService } from "@knodia/db-signup/services";
import { type EmailSender } from "@knodia/ses-email-sender";
import { type Logger } from "pino";

import {
  buildSuspendedUsersCsv,
  buildSuspendedUsersEmailBody,
  formatDateStamp,
} from "./suspendedUsersEmail.ts";

export type NotifierService = ReturnType<typeof notifierServiceBuilder>;

export function notifierServiceBuilder(
  signupDbService: SignupDbService,
  emailSender: EmailSender,
  logger: Logger,
) {
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
            filename: `utenti-sospesi-${formatDateStamp(now)}.csv`,
          },
        ],
        body: buildSuspendedUsersEmailBody(suspended.length, now),
        subject,
        to: recipient,
      });

      // Count only — never log PII or email content.
      logger.info(
        `Suspended-users notification sent for ${suspended.length} user(s)`,
      );
    },
  };
}
