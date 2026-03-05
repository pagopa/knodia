import {
  API_AgreementConsumer,
  API_AgreementState,
} from "@knodia/agreement-models/api";
import { API_Attribute } from "@knodia/attribute-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { z } from "zod";

export const API_AgreementSeed = z
  .strictObject({
    consumer: API_AgreementConsumer,
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({
    description: "Seed data to create a new agreement",
    id: "AgreementSeed",
  });
export type API_AgreementSeed = z.infer<typeof API_AgreementSeed>;

export const API_Agreement = z
  .strictObject({
    attributes: z.array(API_Attribute),
    consumer: API_AgreementConsumer,
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
    id: z.uuid(),
    producerId: z.uuid(),
    state: API_AgreementState,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Agreement" });
export type API_Agreement = z.infer<typeof API_Agreement>;
