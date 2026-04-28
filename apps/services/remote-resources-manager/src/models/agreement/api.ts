import {
  API_AgreementConsumer,
  API_AgreementState,
} from "@knodia/agreement-models/api";
import { API_Attribute } from "@knodia/attribute-models/api";
import {
  API_CreatedResource,
  API_OrganizationId,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import { z } from "zod";

export const API_AgreementSeed = z
  .strictObject({
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({
    description: "Seed data to create a new Agreement",
    id: "AgreementSeed",
  });
export type API_AgreementSeed = z.infer<typeof API_AgreementSeed>;

export const API_CreatedAgreementResource = API_CreatedResource.extend({
  producerId: API_OrganizationId,
}).meta({
  description:
    "Unique identifier of the created Agreement resource along with the E-service Producer ID",
  id: "CreatedAgreementResource",
});
export type API_CreatedAgreementResource = z.infer<
  typeof API_CreatedAgreementResource
>;

export const API_GetAgreementQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetAgreementQueryParams = z.infer<
  typeof API_GetAgreementQueryParams
>;

export const API_GetAgreementsQueryParams = API_PaginationQueryParams.extend({
  state: arrayQueryParam(API_AgreementState)
    .optional()
    .meta({ description: "Filter by Agreement State" }),
});
export type API_GetAgreementsQueryParams = z.infer<
  typeof API_GetAgreementsQueryParams
>;

export const API_Agreement = z
  .strictObject({
    attributes: z.array(API_Attribute).meta({
      description:
        "Describes the Attributes of the E-service that the Consumer possesses when the Agreement is activated (must satisfy at least one Attribute for each Required Attribute Group defined by the E-service)",
    }),
    consumer: API_AgreementConsumer,
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
    id: z.uuid(),
    producerId: API_OrganizationId,
    state: API_AgreementState,
    suspendedByConsumerAt: z.iso.datetime().nullable().meta({
      description: "Timestamp when the Agreement was suspended by the Consumer",
    }),
    suspendedByProducerAt: z.iso.datetime().nullable().meta({
      description: "Timestamp when the Agreement was suspended by the Producer",
    }),
    updatedAt: z.iso.datetime(),
  })
  .meta({
    description: "Agreement between a Consumer and a Producer for an E-service",
    id: "Agreement",
  });
export type API_Agreement = z.infer<typeof API_Agreement>;

export const API_Agreements = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_Agreement),
  })
  .meta({ id: "Agreements" });
export type API_Agreements = z.infer<typeof API_Agreements>;
