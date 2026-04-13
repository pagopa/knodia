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
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import { z } from "zod";

const API_AgreementSeedConsumer = API_AgreementConsumer.extend({
  attributes: z.array(API_Attribute).meta({
    description: "Consumer Organization Attributes",
  }),
}).meta({ id: "AgreementSeedConsumer" });
type API_AgreementSeedConsumer = z.infer<typeof API_AgreementSeedConsumer>;

export const API_AgreementSeed = z
  .strictObject({
    consumer: API_AgreementSeedConsumer,
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
    suspendedByConsumerAt: z.iso.datetime().nullable(),
    suspendedByProducerAt: z.iso.datetime().nullable(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Agreement" });
export type API_Agreement = z.infer<typeof API_Agreement>;

export const API_Agreements = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_Agreement),
  })
  .meta({ id: "Agreements" });
export type API_Agreements = z.infer<typeof API_Agreements>;

export const API_GetAgreementsQueryParams = API_PaginationQueryParams.extend({
  consumerId: API_OrganizationId.optional().meta({
    description: "Filter by Consumer ID",
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
  state: arrayQueryParam(API_AgreementState).optional().meta({
    description: "Filter by Agreement State",
  }),
});
export type API_GetAgreementsQueryParams = z.infer<
  typeof API_GetAgreementsQueryParams
>;
