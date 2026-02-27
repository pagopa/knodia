import { AgreementId, KnodeId } from "@knodia/common-models/ids";
import z from "zod";

export const RemoteAgreement = z.strictObject({
  agreementId: AgreementId,
  id: z.uuid(),
  knodeId: KnodeId,
  updatedAt: z.coerce.date(),
});
export type RemoteAgreement = z.infer<typeof RemoteAgreement>;
