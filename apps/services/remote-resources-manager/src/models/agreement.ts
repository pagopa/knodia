import {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import z from "zod";

export const RemoteAgreement = z.strictObject({
  agreementId: AgreementId,
  consumerId: OrganizationId,
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  knodeId: KnodeId,
  producerId: OrganizationId,
  updatedAt: z.coerce.date(),
});
export type RemoteAgreement = z.infer<typeof RemoteAgreement>;
