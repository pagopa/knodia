import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import nodemailer, { type SendMailOptions } from "nodemailer";

import type { SesEmailSenderConfig } from "./config.ts";

export type EmailSender = ReturnType<typeof initEmailSender>;

interface EmailAttachment {
  content: Buffer | string;
  contentType: string;
  filename: string;
}

export function initEmailSender(
  config: SesEmailSenderConfig,
  sesClient?: SESv2Client,
) {
  const client = sesClient ?? new SESv2Client({ region: config.awsRegion });
  const transporter = nodemailer.createTransport({
    SES: { SendEmailCommand, sesClient: client },
  });
  const from = config.sesSenderLabel
    ? { address: config.sesSenderMail, name: config.sesSenderLabel }
    : config.sesSenderMail;

  return {
    async sendEmail({
      attachments = [],
      body,
      subject,
      to,
    }: {
      attachments?: EmailAttachment[];
      body: string;
      subject: string;
      to: string;
    }): Promise<void> {
      // nodemailer merges `ses` into the SESv2 SendEmail command input.
      const mailOptions: SendMailOptions & {
        ses: { ConfigurationSetName: string };
      } = {
        attachments,
        from,
        ses: { ConfigurationSetName: config.sesConfigurationSet },
        subject,
        text: body,
        to,
      };
      await transporter.sendMail(mailOptions);
    },
  };
}
