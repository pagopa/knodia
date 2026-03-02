import { Attribute } from "@knodia/attribute-models";
import { ExternalResource } from "@knodia/common-models/externalResource";
import {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  OrganizationId,
} from "@knodia/common-models/ids";
import z from "zod";

export const AgreementState = z.enum(["Active", "Suspended", "Archived"]);
export type AgreementState = z.infer<typeof AgreementState>;

export const Agreement = z.strictObject({
  attributes: z.array(Attribute).min(1),
  consumer: ExternalResource<OrganizationId>(),
  createdAt: z.coerce.date(),
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  id: AgreementId,
  producerId: OrganizationId,
  state: AgreementState,
  updatedAt: z.coerce.date(),
});
export type Agreement = z.infer<typeof Agreement>;
