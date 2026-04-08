import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { API_EserviceVersionState } from "@knodia/eservice-models/api";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
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

export const API_GetConsumerPurposeDetailQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetConsumerPurposeDetailQueryParams = z.infer<
  typeof API_GetConsumerPurposeDetailQueryParams
>;

export const API_GetConsumerPurposesQueryParams =
  API_PaginationQueryParams.extend({
    eserviceId: z
      .uuid()
      .optional()
      .meta({ description: "Filter by E-service ID" }),
  });
export type API_GetConsumerPurposesQueryParams = z.infer<
  typeof API_GetConsumerPurposesQueryParams
>;

export const API_ConsumerPurpose = z
  .strictObject({
    dailyCalls: API_PurposeDailyCalls,
    eservice: API_CompactEservice,
    id: z.uuid(),
    // TODO: Replace with actual keychain data when consumer keychains for purposes are implemented
    keychain: z.string(),
    name: API_LocalizedPurposeName,
    producer: API_CompactOrganization,
    state: API_PurposeState,
  })
  .meta({ id: "ConsumerPurpose" });
export type API_ConsumerPurpose = z.infer<typeof API_ConsumerPurpose>;

export const API_ConsumerPurposes = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_ConsumerPurpose),
  })
  .meta({ id: "ConsumerPurposes" });
export type API_ConsumerPurposes = z.infer<typeof API_ConsumerPurposes>;

export const API_GetProducerPurposesQueryParams =
  API_PaginationQueryParams.extend({
    eserviceId: z
      .uuid()
      .optional()
      .meta({ description: "Filter by E-service ID" }),
    state: arrayQueryParam(API_PurposeState)
      .optional()
      .meta({ description: "Filter by Purpose State" }),
  });
export type API_GetProducerPurposesQueryParams = z.infer<
  typeof API_GetProducerPurposesQueryParams
>;

export const API_ProducerPurpose = z
  .strictObject({
    consumer: API_CompactOrganization,
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eservice: API_CompactEservice,
    id: z.uuid(),
    name: API_LocalizedPurposeName,
    state: API_PurposeState,
  })
  .meta({ id: "ProducerPurpose" });
export type API_ProducerPurpose = z.infer<typeof API_ProducerPurpose>;

export const API_ProducerPurposes = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_ProducerPurpose),
  })
  .meta({ id: "ProducerPurposes" });
export type API_ProducerPurposes = z.infer<typeof API_ProducerPurposes>;

export const API_PurposeDetails = z
  .strictObject({
    agreement: API_CompactAgreement,
    consumer: API_CompactOrganization,
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eservice: API_CompactEservice.extend({
      latestVersionState: API_EserviceVersionState,
    }).meta({ id: "PurposeDetailsEservice" }),
    id: z.uuid(),
    maxDailyCallsPerConsumer: z.number().int().meta({ format: "int32" }),
    name: API_LocalizedPurposeName,
    producer: API_CompactOrganization,
    state: API_PurposeState,
  })
  .meta({ id: "PurposeDetails" });
export type API_PurposeDetails = z.infer<typeof API_PurposeDetails>;
