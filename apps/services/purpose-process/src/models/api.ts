import { PurposeId } from "@knodia/common-models/ids";
import {
  maxDailyCalls,
  minDailyCalls,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";
import {
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeConsumer,
  API_PurposeFormAnswers,
  API_PurposeState,
} from "@knodia/purpose-models/api";
import z from "zod";

export const API_PurposeSeed = z
  .strictObject({
    consumer: API_PurposeConsumer,
    dailyCalls: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .meta({ format: "int32" }),
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid(),
    formAnswersJson: API_PurposeFormAnswers,
    formSchemaVersion: PurposeFormSchemaVersion,
    name: API_LocalizedPurposeName,
  })
  .meta({ id: "PurposeSeed" });
export type API_PurposeSeed = z.infer<typeof API_PurposeSeed>;

export const API_Purpose = z
  .strictObject({
    // formAnswersJson is intentionally excluded — it can be retrieved via a separate route
    consumer: API_PurposeConsumer,
    createdAt: z.iso.datetime(),
    dailyCalls: z
      .number()
      .int()
      .min(minDailyCalls)
      .max(maxDailyCalls)
      .meta({ format: "int32" }),
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid(),
    formSchemaVersion: PurposeFormSchemaVersion,
    id: PurposeId,
    name: API_LocalizedPurposeName,
    state: API_PurposeState,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Purpose" });
export type API_Purpose = z.infer<typeof API_Purpose>;

export const API_FormSchemaVersionPathParam = z.strictObject({
  version: z.string().min(1),
});
export type API_FormSchemaVersionPathParam = z.infer<
  typeof API_FormSchemaVersionPathParam
>;

export const API_FormSchema = z
  .record(z.string(), z.unknown())
  .meta({ id: "FormSchema" });
export type API_FormSchema = z.infer<typeof API_FormSchema>;
