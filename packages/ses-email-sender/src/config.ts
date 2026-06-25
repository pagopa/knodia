import { z } from "zod";

// No defaults on purpose: every consumer must pass region + sender explicitly
// via env. The endpoint override (dev/local) is NOT here — it comes from
// aws.config.local in deployed/dev runs, or an injected client in tests.
export const SesEmailSenderConfig = z
  .object({
    AWS_REGION: z.string(),
    SES_SENDER_LABEL: z.string().optional(),
    SES_SENDER_MAIL: z.email(),
  })
  .transform((c) => ({
    awsRegion: c.AWS_REGION,
    sesSenderLabel: c.SES_SENDER_LABEL,
    sesSenderMail: c.SES_SENDER_MAIL,
  }));
export type SesEmailSenderConfig = z.infer<typeof SesEmailSenderConfig>;
