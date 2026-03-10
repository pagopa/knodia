import {
  API_AgreementConsumer,
  API_AgreementState,
} from "@knodia/agreement-models/api";
import { API_Attribute } from "@knodia/attribute-models/api";
import {
  API_OrganizationId,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { z } from "zod";

export const API_AgreementSeed = z
  .strictObject({
    consumer: API_AgreementConsumer,
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
  })
  .meta({ id: "AgreementSeed" });
export type API_AgreementSeed = z.infer<typeof API_AgreementSeed>;

export const API_Agreement = z
  .strictObject({
    attributes: z.array(API_Attribute),
    consumer: API_AgreementConsumer,
    createdAt: z.iso.datetime(),
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
    id: z.uuid(),
    producerId: z.uuid(),
    state: API_AgreementState,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Agreement" });
export type API_Agreement = z.infer<typeof API_Agreement>;

export const API_Agreements = z
  .strictObject({
    items: z.array(API_Agreement),
    pagination: API_Pagination,
  })
  .meta({ id: "Agreements" });
export type API_Agreements = z.infer<typeof API_Agreements>;

export const API_GetAgreementsQueryParams = API_PaginationQueryParams.extend({
  producerId: API_OrganizationId.optional().meta({
    description: "Filter by Producer Organization ID",
  }),
});
export type API_GetAgreementsQueryParams = z.infer<
  typeof API_GetAgreementsQueryParams
>;
