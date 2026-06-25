import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
// MailComposer is not part of nodemailer's public exports and nodemailer has no
// SESv2 transport, so we build the raw MIME ourselves and send it as
// Content.Raw. Importing the concrete path is the documented workaround:
// https://github.com/nodemailer/nodemailer/issues/1430#issuecomment-2046884660
import MailComposer from "nodemailer/lib/mail-composer/index.js";

import type { SesEmailSenderConfig } from "./config.ts";

export type EmailSender = ReturnType<typeof initEmailSender>;

interface EmailAttachment {
  content: Buffer | string;
  contentType: string;
  filename: string;
}

export function initEmailSender(
  config: SesEmailSenderConfig,
  // Injected in tests (endpoint pointing at the mock). In dev/prod it is omitted
  // and the client resolves the endpoint from aws.config.local / real SES.
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
