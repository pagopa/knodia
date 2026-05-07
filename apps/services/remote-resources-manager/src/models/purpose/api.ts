import {
  API_CreatedResource,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import {
  API_ExternalPurposeFormSchemaVersion,
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeConsumer,
  API_PurposeDailyCalls,
  API_PurposeFormAnswers,
  API_PurposeState,
} from "@knodia/purpose-models/api";
import { z } from "zod";

export const API_PurposeSeed = z
  .strictObject({
    dailyCalls: API_PurposeDailyCalls.meta({
      description: "Expected number of daily API calls for this Purpose",
      format: "int32",
    }),
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid().meta({
      description: "Identifier of the E-service this Purpose refers to",
    }),
    formAnswersJson: API_PurposeFormAnswers,
    formSchemaVersion: API_ExternalPurposeFormSchemaVersion,
    knodeId: API_KnodeId,
    name: API_LocalizedPurposeName,
    template: z.strictObject({ id: z.uuid(), knodeId: API_KnodeId }).optional(),
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
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid(),
    id: z.uuid(),
    knodeId: API_KnodeId.meta({
      description: "Knode ID of the producer's Knode that owns this Purpose",
    }),
    name: API_LocalizedPurposeName,
    state: API_PurposeState,
    suspendedByConsumerAt: z.iso.datetime().nullable().meta({
      description: "Timestamp when the Purpose was suspended by the Consumer",
    }),
    suspendedByProducerAt: z.iso.datetime().nullable().meta({
      description: "Timestamp when the Purpose was suspended by the Producer",
    }),
    template: z.strictObject({ id: z.uuid(), knodeId: API_KnodeId }).optional(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Purpose" });
export type API_Purpose = z.infer<typeof API_Purpose>;

export const API_GetPurposesQueryParams = API_PaginationQueryParams.extend({
  eserviceId: z
    .uuid()
    .optional()
    .meta({ description: "Filter by E-service ID" }),
  state: arrayQueryParam(API_PurposeState).optional().meta({
    description: "Filter by Purpose State",
  }),
});
export type API_GetPurposesQueryParams = z.infer<
  typeof API_GetPurposesQueryParams
>;

export const API_Purposes = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_Purpose),
  })
  .meta({ id: "Purposes" });
export type API_Purposes = z.infer<typeof API_Purposes>;
