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
      // nodemailer forwards `ses` to the SESv2 SendEmail command; ConfigurationSetName
      // is only set when configured, otherwise the send is left untouched.
      const mailOptions: SendMailOptions & {
        ses?: { ConfigurationSetName: string };
      } = {
        attachments,
        from,
        subject,
        text: body,
        to,
        ...(config.sesConfigurationSet
          ? { ses: { ConfigurationSetName: config.sesConfigurationSet } }
          : {}),
      };
      await transporter.sendMail(mailOptions);
    },
  };
}
