import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import {
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import {
  API_CompactOrganization,
  API_CompactProducer,
} from "@knodia/organization-models/api";
import {
  API_ExternalPurposeFormSchemaVersion,
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeDailyCalls,
  API_PurposeFormAnswers,
  API_PurposeFormSchema,
  API_PurposeFormTexts,
  API_PurposeFormUiSchema,
  API_PurposeFormUiTexts,
  API_PurposeState,
  API_PurposeTemplateReference,
} from "@knodia/purpose-models/api";
import z from "zod";

import { API_CompactAgreement } from "../agreement/api.ts";
import { API_CompactEservice } from "../eservice/api.ts";

const API_PurposeSeedBase = z.strictObject({
  dailyCalls: API_PurposeDailyCalls,
  description: API_LocalizedPurposeDescription,
  eserviceId: z.uuid(),
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
    description:
      "Seed data to create a new Purpose for an E-service on behalf of a Consumer. The request body can be either PurposeSeedForProvideData or PurposeSeedForReceiveData based on the Eservice mode. The first one carries inline form answers compiled by the Consumer, while the second one references a pre-filled PurposeFormOption compiled by the Producer.",
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

export const API_GetConsumerEservicePurposeFormOptionsQueryParams =
  z.strictObject({
    knodeId: API_KnodeId,
  });
export type API_GetConsumerEservicePurposeFormOptionsQueryParams = z.infer<
  typeof API_GetConsumerEservicePurposeFormOptionsQueryParams
>;

export const API_ConsumerPurposeFormOption = z
  .strictObject({
    description: API_LocalizedPurposeDescription,
    formAnswersJson: API_PurposeFormAnswers,
    id: z.uuid(),
    name: API_LocalizedPurposeName,
    schema: API_PurposeFormSchema,
    texts: API_PurposeFormTexts,
    uiSchema: API_PurposeFormUiSchema,
    uiTexts: API_PurposeFormUiTexts,
    version: API_ExternalPurposeFormSchemaVersion,
  })
  .meta({
    description:
      "Pre-filled PurposeFormOption enriched at runtime with the corresponding form schema, UI schema, legal texts and UI texts fetched from the Producer's purpose-process by formSchemaVersion",
    id: "ConsumerPurposeFormOption",
  });
export type API_ConsumerPurposeFormOption = z.infer<
  typeof API_ConsumerPurposeFormOption
>;

export const API_ConsumerPurposeFormOptions = z
  .strictObject({
    items: z.array(API_ConsumerPurposeFormOption),
  })
  .meta({ id: "ConsumerPurposeFormOptions" });
export type API_ConsumerPurposeFormOptions = z.infer<
  typeof API_ConsumerPurposeFormOptions
>;

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

export const API_SuspendReactivatePurposeByConsumerQueryParams = z.strictObject(
  {
    knodeId: API_KnodeId,
  },
);

export const API_ArchiveConsumerPurposeQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});

export const API_GetConsumerPurposesQueryParams =
  API_PaginationQueryParams.extend({
    eserviceId: z.uuid().optional().meta({
      description:
        "Filter by E-service ID. Can only be used together with `knodeId`.",
    }),
    knodeId: API_KnodeId.optional().meta({
      description:
        "Knode ID to list Purposes from. Required when `eserviceId` is set.",
    }),
    state: arrayQueryParam(API_PurposeState)
      .optional()
      .meta({ description: "Filter by Purpose State" }),
  }).refine((q) => !(q.eserviceId && !q.knodeId), {
    message: "`eserviceId` can only be used together with `knodeId`",
  });
export type API_GetConsumerPurposesQueryParams = z.infer<
  typeof API_GetConsumerPurposesQueryParams
>;

export const API_ConsumerPurpose = z
  .strictObject({
    dailyCalls: API_PurposeDailyCalls,
    eservice: API_CompactEservice,
    hasRecentlyBeenUpdated: z.boolean().meta({
      description: "Indicates whether the Purpose has been recently updated",
    }),
    id: z.uuid(),
    keychains: z.int().min(0).meta({
      description: "Number of Consumer Keychains associated with this purpose",
      format: "int32",
    }),
    knodeId: API_KnodeId.meta({
      description: "Knode ID of the producer's Knode that owns this Purpose",
    }),
    name: API_LocalizedPurposeName,
    producer: API_CompactProducer,
    state: API_PurposeState,
    updatedAt: z.iso.datetime(),
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
    agreementId: z
      .uuid()
      .optional()
      .meta({ description: "Filter by Agreement ID" }),
    eserviceId: z
      .uuid()
      .optional()
      .meta({ description: "Filter by E-service ID" }),
    recentlyUpdated: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional()
      .meta({
        description:
          "Filter to only Purposes updated within the recent update window",
      }),
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
    hasRecentlyBeenUpdated: z.boolean().meta({
      description: "Indicates whether the Purpose has been recently updated",
    }),
    id: z.uuid(),
    name: API_LocalizedPurposeName,
    state: API_PurposeState,
    updatedAt: z.iso.datetime(),
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
    knodeId: API_KnodeId.meta({
      description: "Knode ID of the producer's Knode that owns this Purpose",
    }),
    maxDailyCallsPerConsumer: z.number().int().meta({ format: "int32" }),
    name: API_LocalizedPurposeName,
    producer: API_CompactProducer,
    state: API_PurposeState,
    suspendedByConsumerAt: z.iso.datetime().nullable(),
    suspendedByProducerAt: z.iso.datetime().nullable(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "PurposeDetails" });
export type API_PurposeDetails = z.infer<typeof API_PurposeDetails>;
