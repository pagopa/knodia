import { RequiredAttributeGroup } from "@knodia/attribute-models";
import {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  ExternalId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import z from "zod";

export const AgreementState = z.enum(["Active", "Suspended", "Archived"]);
export type AgreementState = z.infer<typeof AgreementState>;

const AgreementConsumer = z.strictObject({
  id: ExternalId<OrganizationId>(),
  knodeId: KnodeId,
});
export type AgreementConsumer = z.infer<typeof AgreementConsumer>;

export const Agreement = z.strictObject({
  consumer: AgreementConsumer,
  createdAt: z.coerce.date(),
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  id: AgreementId,
  producerId: OrganizationId,
  requiredAttributes: z.array(RequiredAttributeGroup).min(1),
  state: AgreementState,
  updatedAt: z.coerce.date(),
});
export type Agreement = z.infer<typeof Agreement>;
