import { API_CreatedResource } from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { maxDailyCalls, minDailyCalls } from "@knodia/purpose-models";
import {
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeConsumer,
  API_PurposeFormAnswers,
  API_PurposeFormSchemaVersion,
  API_PurposeState,
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
    formSchemaVersion: API_PurposeFormSchemaVersion,
    knodeId: API_KnodeId,
    name: API_LocalizedPurposeName,
  })
  .meta({
    description: "Seed data to create a new Purpose",
    id: "PurposeSeed",
  });
export type API_PurposeSeed = z.infer<typeof API_PurposeSeed>;

export const API_GetPurposeFormSchemaQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetPurposeFormSchemaQueryParams = z.infer<
  typeof API_GetPurposeFormSchemaQueryParams
>;

export const API_CreatedPurposeResource = API_CreatedResource.meta({
  description: "Unique identifier of the created Purpose resource",
  id: "CreatedPurposeResource",
});
export type API_CreatedPurposeResource = z.infer<
  typeof API_CreatedPurposeResource
>;

export const API_GetPurposeQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetPurposeQueryParams = z.infer<
  typeof API_GetPurposeQueryParams
>;

export const API_Purpose = z
  .strictObject({
    // formAnswersJson and formSchemaVersion are intentionally excluded —
    // they can be retrieved via separate routes
    consumer: API_PurposeConsumer,
    dailyCalls: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .meta({ format: "int32" }),
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid(),
    formSchemaVersion: API_PurposeFormSchemaVersion,
    id: z.uuid(),
    name: API_LocalizedPurposeName,
    state: API_PurposeState,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Purpose" });
export type API_Purpose = z.infer<typeof API_Purpose>;
