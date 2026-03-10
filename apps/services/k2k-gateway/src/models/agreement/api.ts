import { API_OrganizationId } from "@knodia/common-models/api";
import { z } from "zod";

import { API_EserviceId, API_EserviceVersionId } from "../eservice/api.ts";

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
