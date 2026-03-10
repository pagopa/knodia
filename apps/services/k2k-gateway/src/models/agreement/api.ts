import { API_OrganizationId } from "@knodia/common-models/api";
import { z } from "zod";

import { API_Attribute } from "../attribute/api.ts";
import { API_EserviceId, API_EserviceVersionId } from "../eservice/api.ts";

const API_AgreementId = z.uuid().meta({
  description: "Unique identifier of the Agreement",
  id: "AgreementId",
});

export const API_KnodeId = z.enum(["ORION", "LYNX"]).meta({
  description: "Unique Knode identifier",
  id: "KnodeId",
});
export type API_KnodeId = z.infer<typeof API_KnodeId>;

export const API_AgreementConsumer = z
  .strictObject({
    id: API_OrganizationId,
    knodeId: API_KnodeId,
  })
  .meta({
    description: "Consumer Organization of the Agreement",
    id: "AgreementConsumer",
  });
export type API_AgreementConsumer = z.infer<typeof API_AgreementConsumer>;

export const API_AgreementSeed = z
  .strictObject({
    consumerId: API_OrganizationId,
    eserviceId: API_EserviceId,
    eserviceVersionId: API_EserviceVersionId,
  })
  .meta({
    description: "Seed data to create a new Agreement",
    id: "AgreementSeed",
  });
export type API_AgreementSeed = z.infer<typeof API_AgreementSeed>;

export const API_AgreementState = z
  .enum(["ACTIVE", "SUSPENDED", "ARCHIVED"])
  .meta({
    description: "Describes the states an Agreement can be in",
    id: "AgreementState",
  });
export type API_AgreementState = z.infer<typeof API_AgreementState>;

export const API_AgreementIdPathParam = z.strictObject({
  agreementId: API_AgreementId,
});

export const API_Agreement = z
  .strictObject({
    attributes: z.array(API_Attribute).meta({
      description:
        "Describes the Attributes of the E-service that the Consumer possesses when the Agreement is activated (must satisfy at least one Attribute for each Required Attribute Group defined by the E-service)",
    }),
    consumer: API_AgreementConsumer,
    eserviceId: API_EserviceId,
    eserviceVersionId: API_EserviceVersionId,
    id: API_AgreementId,
    producerId: API_OrganizationId,
    state: API_AgreementState,
    updatedAt: z.iso.datetime(),
  })
  .meta({
    description: "Agreement between a Consumer and a Producer for an E-service",
    id: "Agreement",
  });
export type API_Agreement = z.infer<typeof API_Agreement>;
