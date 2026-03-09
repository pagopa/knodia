import { API_AgreementState } from "@knodia/agreement-models/api";
import {
  API_KnodeId,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import z from "zod";

import { API_CompactEservice } from "../eservice/api.ts";
import { API_CompactOrganization } from "../organization/api.ts";

export const API_GetProducerAgreementsQueryParams =
  API_PaginationQueryParams.extend({
    consumerId: z
      .uuid()
      .optional()
      .meta({ description: "Filter by Consumer ID" }),
    consumerKnodeId: API_KnodeId.optional().meta({
      description: "Filter by Consumer Knode ID",
    }),
    eserviceId: z
      .uuid()
      .optional()
      .meta({ description: "Filter by E-service ID" }),
    sortBy: z
      .enum(["eserviceName", "state"]) // TODO: add consumerName
      .optional()
      .meta({ description: "Field to sort by" }),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .meta({ description: "Sort direction" }),
    state: API_AgreementState.optional().meta({
      description: "Filter by Agreement State",
    }),
  });
export type API_GetProducerAgreementsQueryParams = z.infer<
  typeof API_GetProducerAgreementsQueryParams
>;

export const API_ProducerAgreement = z
  .strictObject({
    consumer: API_CompactOrganization,
    eservice: API_CompactEservice,
    id: z.uuid(),
    state: API_AgreementState,
  })
  .meta({ id: "ProducerAgreement" });
export type API_ProducerAgreement = z.infer<typeof API_ProducerAgreement>;

export const API_ProducerAgreements = z
  .strictObject({
    items: z.array(API_ProducerAgreement),
    pagination: API_Pagination,
  })
  .meta({ id: "ProducerAgreements" });
export type API_ProducerAgreements = z.infer<typeof API_ProducerAgreements>;
