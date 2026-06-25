import { SignupDbConfig } from "@knodia/db-signup/config";
import { LoggerConfig } from "@knodia/logger/config";
import { SesEmailSenderConfig } from "@knodia/ses-email-sender/config";
import { z } from "zod";

// This is the only place the recipient/subject defaults live: the SES package
// is deliberately default-free, so the consuming service owns the env defaults.
const SuspendedUsersNotifierConfig = LoggerConfig.and(SignupDbConfig)
  .and(SesEmailSenderConfig)
  .and(
    z
      .object({
        SUSPENDED_USERS_NOTIFICATION_RECIPIENT: z
          .email()
          .default("dpo@pagopa.it"),
        SUSPENDED_USERS_NOTIFICATION_SUBJECT: z
          .string()
          .default("KNODIA: Request for application of Right to Restriction"),
      })
      .transform((c) => ({
        notificationRecipient: c.SUSPENDED_USERS_NOTIFICATION_RECIPIENT,
        notificationSubject: c.SUSPENDED_USERS_NOTIFICATION_SUBJECT,
      })),
  );
type SuspendedUsersNotifierConfig = z.infer<
  typeof SuspendedUsersNotifierConfig
>;

export const config = SuspendedUsersNotifierConfig.parse(process.env);
