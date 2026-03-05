import { API_AgreementConsumer } from "@knodia/agreement-models/api";
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
