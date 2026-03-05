import { ExternalId } from "@knodia/common-models/externalResource";
import {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import z from "zod";

export const RemoteAgreement = z.strictObject({
  agreementId: ExternalId<AgreementId>(),
  consumerId: OrganizationId,
  createdAt: z.coerce.date(),
  eserviceId: ExternalId<EserviceId>(),
  eserviceVersionId: ExternalId<EserviceVersionId>(),
  knodeId: KnodeId,
  producerId: ExternalId<OrganizationId>(),
});
export type RemoteAgreement = z.infer<typeof RemoteAgreement>;
