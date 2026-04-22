import { AgreementId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import z from "zod";

export const API_AgreementState = z
  .enum([
    "Active",
    "Suspended",
    "Archived",
    "PendingConsumerOperatorIdentification",
  ])
  .meta({ id: "AgreementState" });
export type API_AgreementState = z.infer<typeof API_AgreementState>;

export const API_AgreementConsumer = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({ id: "AgreementConsumer" });
export type API_AgreementConsumer = z.infer<typeof API_AgreementConsumer>;

export const API_AgreementIdPathParam = z.strictObject({
  agreementId: AgreementId,
});
export type API_AgreementIdPathParam = z.infer<typeof API_AgreementIdPathParam>;

export const API_ActivationMagicLinkRequest = z
  .strictObject({
    knodeId: API_KnodeId,
  })
  .meta({
    description:
      "Identifies which Producer Knode should mint the activation magic link for the Agreement in the path param",
    id: "ActivationMagicLinkRequest",
  });
export type API_ActivationMagicLinkRequest = z.infer<
  typeof API_ActivationMagicLinkRequest
>;

export const API_MagicLink = z
  .strictObject({
    expiresAt: z.iso.datetime().meta({
      description:
        "ISO 8601 timestamp after which the magic link is no longer valid",
    }),
    url: z.url().meta({
      description:
        "Absolute URL of the target Knode's frontend, carrying a signed token for the action",
    }),
  })
  .meta({
    description:
      "A signed, single-action link a Consumer user can follow to perform an action on the Producer Knode's frontend",
    id: "MagicLink",
  });
export type API_MagicLink = z.infer<typeof API_MagicLink>;
