import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
// nodemailer has no SESv2 transport, so we build the raw MIME ourselves and
// send it as Content.Raw. MailComposer isn't a public export — import the path.
import MailComposer from "nodemailer/lib/mail-composer/index.js";

import type { SesEmailSenderConfig } from "./config.ts";

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
  const from = config.sesSenderLabel
    ? `${config.sesSenderLabel} <${config.sesSenderMail}>`
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
      const rawMessage = await new MailComposer({
        attachments,
        from,
        subject,
        text: body,
        to,
      })
        .compile()
        .build();

      await client.send(
        new SendEmailCommand({
          Content: { Raw: { Data: rawMessage } },
          Destination: { ToAddresses: [to] },
          FromEmailAddress: from,
        }),
      );
    },
  };
}
