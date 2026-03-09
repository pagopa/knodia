import { API_OrganizationId } from "@knodia/common-models/api";
import { z } from "zod";

import { API_EserviceId, API_EserviceVersionId } from "../eservice/api.ts";

export const API_KnodeId = z.enum(["ORION", "LYNX"]).meta({
  description: "Unique Knode identifier",
  id: "KnodeId",
});
export type API_KnodeId = z.infer<typeof API_KnodeId>;

export const API_AgreementConsumer = z
  .strictObject({
    id: z.uuid(),
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
