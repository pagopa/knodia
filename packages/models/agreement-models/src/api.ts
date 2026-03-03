import { API_Attribute } from "@knodia/attribute-models/api";
import { API_KnodeId } from "@knodia/common-models/api";
import z from "zod";

export const API_AgreementState = z
  .enum(["Active", "Suspended", "Archived"])
  .meta({ id: "AgreementState" });
export type API_AgreementState = z.infer<typeof API_AgreementState>;

export const API_AgreementConsumer = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({ id: "AgreementConsumer" });
export type API_AgreementConsumer = z.infer<typeof API_AgreementConsumer>;

export const API_Agreement = z
  .strictObject({
    attributes: z.array(API_Attribute),
    consumer: API_AgreementConsumer,
    createdAt: z.iso.datetime(),
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
    id: z.uuid(),
    producerId: z.uuid(),
    state: API_AgreementState,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Agreement" });
export type API_Agreement = z.infer<typeof API_Agreement>;
