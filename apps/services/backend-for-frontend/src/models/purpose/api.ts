import { API_KnodeId } from "@knodia/common-models/internalApi";
import { API_EserviceVersionState } from "@knodia/eservice-models/api";
import { API_CompactOrganization } from "@knodia/organization-models/api";
import {
  API_ExternalPurposeFormSchemaVersion,
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeDailyCalls,
  API_PurposeFormAnswers,
  API_PurposeState,
} from "@knodia/purpose-models/api";
import z from "zod";

import { API_CompactAgreement } from "../agreement/api.ts";
import { API_CompactEservice } from "../eservice/api.ts";

export const API_PurposeSeed = z
  .strictObject({
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid(),
    formAnswersJson: API_PurposeFormAnswers,
    formSchemaVersion: API_ExternalPurposeFormSchemaVersion,
    knodeId: API_KnodeId,
    name: API_LocalizedPurposeName,
  })
  .meta({
    description: "Seed data to create a new Purpose",
    id: "PurposeSeed",
  });
export type API_PurposeSeed = z.infer<typeof API_PurposeSeed>;

export const API_GetConsumerPurposeFormSchemaQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetConsumerPurposeFormSchemaQueryParams = z.infer<
  typeof API_GetConsumerPurposeFormSchemaQueryParams
>;

export const API_ProducerPurposeDetails = z
  .strictObject({
    agreement: API_CompactAgreement,
    consumer: API_CompactOrganization,
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eservice: API_CompactEservice.extend({
      latestVersionState: API_EserviceVersionState,
    }).meta({ id: "ProducerPurposeDetailsEservice" }),
    id: z.uuid(),
    maxDailyCallsPerConsumer: z.number().int().meta({ format: "int32" }),
    name: API_LocalizedPurposeName,
    producer: API_CompactOrganization,
    state: API_PurposeState,
  })
  .meta({ id: "ProducerPurposeDetails" });
export type API_ProducerPurposeDetails = z.infer<
  typeof API_ProducerPurposeDetails
>;
