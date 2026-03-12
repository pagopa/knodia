import {
  API_CreatedResource,
  API_OrganizationId,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { z } from "zod";

export const API_AgreementSeed = z
  .strictObject({
    consumerId: API_OrganizationId,
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({
    description: "Seed data to create a new agreement",
    id: "AgreementSeed",
  });
export type API_AgreementSeed = z.infer<typeof API_AgreementSeed>;

export const API_CreatedAgreementResource = API_CreatedResource.extend({
  producerId: API_OrganizationId,
}).meta({
  description:
    "Unique identifier of the created Agreement resource along with the E-service Producer ID",
  id: "CreatedAgreementResource",
});
export type API_CreatedAgreementResource = z.infer<
  typeof API_CreatedAgreementResource
>;
