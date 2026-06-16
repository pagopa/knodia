import {
  API_CreatedResource,
  API_Pagination,
  API_PaginationQueryParams,
  requireKnodeIdWithEserviceId,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { API_EserviceMode } from "@knodia/eservice-models/api";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import {
  API_ExternalPurposeFormSchemaVersion,
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeConsumer,
  API_PurposeDailyCalls,
  API_PurposeFormAnswers,
  API_PurposeState,
  API_PurposeTemplateReference,
} from "@knodia/purpose-models/api";
import { z } from "zod";

const API_PurposeSeedBase = z.strictObject({
  dailyCalls: API_PurposeDailyCalls.meta({
    description: "Expected number of daily API calls for this Purpose",
    format: "int32",
  }),
  description: API_LocalizedPurposeDescription,
  eserviceId: z.uuid().meta({
    description: "Identifier of the E-service this Purpose refers to",
  }),
  knodeId: API_KnodeId,
  name: API_LocalizedPurposeName,
});

const API_PurposeSeedForProvideData = API_PurposeSeedBase.extend({
  eserviceMode: API_EserviceMode.extract(["ProvideData"]),
  formAnswersJson: API_PurposeFormAnswers,
  formSchemaVersion: API_ExternalPurposeFormSchemaVersion,
  template: API_PurposeTemplateReference.optional(),
}).meta({ id: "PurposeSeedForProvideData" });

const API_PurposeSeedForReceiveData = API_PurposeSeedBase.extend({
  eserviceMode: API_EserviceMode.extract(["ReceiveData"]),
  purposeFormOptionId: z.uuid().meta({
    description:
      "Identifier of the PurposeFormOption (pre-filled set of form answers) chosen by the Consumer among those published by the Producer on the E-service",
  }),
}).meta({ id: "PurposeSeedForReceiveData" });

export const API_PurposeSeed = z
  .discriminatedUnion("eserviceMode", [
    API_PurposeSeedForProvideData,
    API_PurposeSeedForReceiveData,
  ])
  .meta({
    discriminator: {
      mapping: {
        ProvideData: "#/components/schemas/PurposeSeedForProvideData",
        ReceiveData: "#/components/schemas/PurposeSeedForReceiveData",
      },
      propertyName: "eserviceMode",
    },
    id: "PurposeSeed",
  });
export type API_PurposeSeed = z.infer<typeof API_PurposeSeed>;

export const API_GetPurposeFormSchemaQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetPurposeFormSchemaQueryParams = z.infer<
  typeof API_GetPurposeFormSchemaQueryParams
>;

export const API_CreatedPurposeResource = API_CreatedResource.extend({
  knodeId: API_KnodeId.meta({
    description: "Knode ID of the producer's Knode that owns this Purpose",
  }),
}).meta({
  description:
    "Unique identifier of the created Purpose resource along with the owning Knode",
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
    template: API_PurposeTemplateReference.optional(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Purpose" });
export type API_Purpose = z.infer<typeof API_Purpose>;

export const API_GetPurposesQueryParams = requireKnodeIdWithEserviceId(
  API_PaginationQueryParams.extend({
    eserviceId: z.uuid().optional().meta({
      description:
        "Filter by E-service ID. Can only be used together with `knodeId`.",
    }),
    knodeId: API_KnodeId.optional().meta({
      description:
        "Knode ID to list Purposes from. Required when `eserviceId` is set.",
    }),
    state: arrayQueryParam(API_PurposeState).optional().meta({
      description: "Filter by Purpose State",
    }),
  }),
);
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
