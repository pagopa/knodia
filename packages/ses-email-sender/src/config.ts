import { z } from "zod";

export const SesEmailSenderConfig = z
  .object({
    AWS_REGION: z.string(),
    SES_CONFIGURATION_SET: z.string(),
    SES_SENDER_LABEL: z.string().optional(),
    SES_SENDER_MAIL: z.email(),
  })
  .transform((c) => ({
    awsRegion: c.AWS_REGION,
    sesConfigurationSet: c.SES_CONFIGURATION_SET,
    sesSenderLabel: c.SES_SENDER_LABEL,
    sesSenderMail: c.SES_SENDER_MAIL,
  }));
export type SesEmailSenderConfig = z.infer<typeof SesEmailSenderConfig>;
