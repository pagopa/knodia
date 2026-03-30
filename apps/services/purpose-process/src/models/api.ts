import { PurposeId } from "@knodia/common-models/ids";
import {
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeConsumer,
  API_PurposeDailyCalls,
  API_PurposeFormAnswers,
  API_PurposeFormSchemaVersion,
  API_PurposeState,
} from "@knodia/purpose-models/api";
import z from "zod";
export const API_PurposeSeed = z
  .strictObject({
    consumer: API_PurposeConsumer,
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid(),
    formAnswersJson: API_PurposeFormAnswers,
    formSchemaVersion: API_PurposeFormSchemaVersion,
    name: API_LocalizedPurposeName,
  })
  .meta({ id: "PurposeSeed" });
export type API_PurposeSeed = z.infer<typeof API_PurposeSeed>;

export const API_Purpose = z
  .strictObject({
    // formAnswersJson and formSchemaVersion are intentionally excluded —
    // they can be retrieved via separate routes
    consumer: API_PurposeConsumer,
    createdAt: z.iso.datetime(),
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid(),
    id: PurposeId,
    name: API_LocalizedPurposeName,
    state: API_PurposeState,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Purpose" });
export type API_Purpose = z.infer<typeof API_Purpose>;
