import {
  API_OrganizationId,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { PurposeId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import {
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeConsumer,
  API_PurposeDailyCalls,
  API_PurposeFormAnswers,
  API_PurposeFormSchema,
  API_PurposeFormSchemaVersion,
  API_PurposeFormTexts,
  API_PurposeFormUiSchema,
  API_PurposeFormUiTexts,
  API_PurposeState,
  API_PurposeTemplateReference,
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
    template: API_PurposeTemplateReference.optional(),
  })
  .meta({ id: "PurposeSeed" });
export type API_PurposeSeed = z.infer<typeof API_PurposeSeed>;

export const API_ReversePurposeSeed = z
  .strictObject({
    consumer: API_PurposeConsumer,
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid(),
    name: API_LocalizedPurposeName,
    purposeFormAnswerId: z.uuid(),
  })
  .meta({ id: "ReversePurposeSeed" });
export type API_ReversePurposeSeed = z.infer<typeof API_ReversePurposeSeed>;

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
    suspendedByConsumerAt: z.iso.datetime().nullable(),
    suspendedByProducerAt: z.iso.datetime().nullable(),
    template: API_PurposeTemplateReference.optional(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Purpose" });
export type API_Purpose = z.infer<typeof API_Purpose>;

export const API_Purposes = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_Purpose),
  })
  .meta({ id: "Purposes" });
export type API_Purposes = z.infer<typeof API_Purposes>;

export const API_GetPurposesQueryParams = API_PaginationQueryParams.extend({
  agreementId: z
    .uuid()
    .optional()
    .meta({ description: "Filter by Agreement ID" }),
  consumerId: API_OrganizationId.optional().meta({
    description: "Filter by Consumer Organization ID",
  }),
  consumerKnodeId: API_KnodeId.optional().meta({
    description: "Filter by Consumer Knode ID",
  }),
  eserviceId: z
    .uuid()
    .optional()
    .meta({ description: "Filter by E-service ID" }),
  producerId: API_OrganizationId.optional().meta({
    description: "Filter by Producer Organization ID",
  }),
  state: arrayQueryParam(API_PurposeState)
    .optional()
    .meta({ description: "Filter by Purpose State" }),
  updatedSince: z.iso.datetime().optional().meta({
    description: "Filter Purposes updated at or after this timestamp",
  }),
});
export type API_GetPurposesQueryParams = z.infer<
  typeof API_GetPurposesQueryParams
>;

export const API_GetTotalDailyCallsQueryParams = z.strictObject({
  eserviceId: z.uuid().meta({ description: "Filter by E-service ID" }),
  state: arrayQueryParam(API_PurposeState)
    .optional()
    .meta({ description: "Filter by Purpose State" }),
});
export type API_GetTotalDailyCallsQueryParams = z.infer<
  typeof API_GetTotalDailyCallsQueryParams
>;

export const API_TotalDailyCalls = z
  .strictObject({
    totalDailyCalls: z.number().int().min(0).meta({
      description:
        "Sum of daily API calls declared by Purposes matching the filters",
      format: "int64",
    }),
  })
  .meta({ id: "TotalDailyCalls" });
export type API_TotalDailyCalls = z.infer<typeof API_TotalDailyCalls>;

export const API_CurrentPurposeFormSchemasResponse = z
  .strictObject({
    schema: API_PurposeFormSchema,
    texts: API_PurposeFormTexts,
    uiSchema: API_PurposeFormUiSchema,
    uiTexts: API_PurposeFormUiTexts,
    version: API_PurposeFormSchemaVersion,
  })
  .meta({ id: "CurrentPurposeFormSchemasResponse" });
