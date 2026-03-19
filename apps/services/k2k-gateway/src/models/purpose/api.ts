import {
  API_CreatedResource,
  API_OrganizationId,
} from "@knodia/common-models/api";
import { z } from "zod";

import { API_EserviceId } from "../eservice/api.ts";

const API_LocalizedText = z.strictObject({
  en: z.string(),
});

export const API_PurposeSeed = z
  .strictObject({
    consumerId: API_OrganizationId,
    dailyCalls: z.number().int().min(0).meta({ format: "int32" }),
    description: API_LocalizedText,
    eserviceId: API_EserviceId,
    formAnswersJson: z.record(z.string(), z.unknown()),
    name: API_LocalizedText,
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
