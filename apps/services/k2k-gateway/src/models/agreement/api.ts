import { z } from "zod";

export const API_KnodeId = z.enum(["ORION", "LYNX"]).meta({
  description: "Unique identifier for an external Knode",
  id: "ExternalKnodeId",
});
export type API_KnodeId = z.infer<typeof API_KnodeId>;

export const API_AgreementState = z
  .enum(["ACTIVE", "SUSPENDED", "ARCHIVED"])
  .meta({ id: "AgreementState" });
export type API_AgreementState = z.infer<typeof API_AgreementState>;

export const API_AgreementConsumer = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({
    description: "External consumer of the agreement",
    id: "AgreementConsumer",
  });
export type API_AgreementConsumer = z.infer<typeof API_AgreementConsumer>;

const API_AgreementAttribute = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .meta({
    description: "Attribute associated to the agreement",
    id: "AgreementAttribute",
  });

export const API_Agreement = z
  .strictObject({
    attributes: z
      .array(API_AgreementAttribute)
      .meta({ description: "Attributes for the Agreement" }),
    consumer: API_AgreementConsumer,
    createdAt: z.iso.datetime(),
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
    id: z.uuid(),
    producerId: z.uuid(),
    state: API_AgreementState,
    updatedAt: z.iso.datetime(),
  })
  .meta({
    description: "Agreement between a consumer and a producer for an e-service",
    id: "Agreement",
  });
export type API_Agreement = z.infer<typeof API_Agreement>;

export const API_AgreementSeed = z
  .strictObject({
    consumerId: z.uuid(),
    consumerKnodeId: API_KnodeId,
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
  })
  .meta({
    description: "Seed data to create a new agreement",
    id: "AgreementSeed",
  });
export type API_AgreementSeed = z.infer<typeof API_AgreementSeed>;
