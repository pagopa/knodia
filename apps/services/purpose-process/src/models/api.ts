import {
  API_OrganizationId,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { PurposeId } from "@knodia/common-models/ids";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
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
});
export type API_GetPurposesQueryParams = z.infer<
  typeof API_GetPurposesQueryParams
>;
