import { API_KnodeId } from "@knodia/common-models/internalApi";
import { maxDailyCalls, minDailyCalls } from "@knodia/purpose-models";
import {
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeFormAnswers,
  API_PurposeFormSchemaVersion,
} from "@knodia/purpose-models/api";
import z from "zod";

export const API_PurposeSeed = z
  .strictObject({
    dailyCalls: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .meta({ format: "int32" }),
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid(),
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
