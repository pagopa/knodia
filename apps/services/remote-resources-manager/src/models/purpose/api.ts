import { API_CreatedResource } from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { maxDailyCalls, minDailyCalls } from "@knodia/purpose-models";
import {
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeFormAnswers,
} from "@knodia/purpose-models/api";
import { z } from "zod";

export const API_PurposeSeed = z
  .strictObject({
    dailyCalls: z.number().int().min(minDailyCalls).max(maxDailyCalls).meta({
      description: "Expected number of daily API calls for this Purpose",
      format: "int32",
    }),
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid().meta({
      description: "Identifier of the E-service this Purpose refers to",
    }),
    formAnswersJson: API_PurposeFormAnswers,
    knodeId: API_KnodeId,
    name: API_LocalizedPurposeName,
  })
  .meta({
    description: "Seed data to create a new Purpose",
    id: "PurposeSeed",
  });
export type API_PurposeSeed = z.infer<typeof API_PurposeSeed>;

export const API_CreatedPurposeResource = API_CreatedResource.meta({
  description: "Unique identifier of the created Purpose resource",
  id: "CreatedPurposeResource",
});
export type API_CreatedPurposeResource = z.infer<
  typeof API_CreatedPurposeResource
>;
