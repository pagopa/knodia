import {
  API_CreatedResource,
  API_OrganizationId,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import {
  maxDailyCalls,
  maxDescriptionLength,
  maxNameLength,
  minDailyCalls,
  minDescriptionLength,
  minNameLength,
} from "@knodia/purpose-models";
import { z } from "zod";

import { API_EserviceId } from "../eservice/api.ts";
import { API_KnodeId } from "../knode/api.ts";

const API_PurposeId = z.uuid().meta({
  description: "Unique identifier of the Purpose",
  id: "PurposeId",
});

const API_PurposeFormSchemaVersion = z.string().meta({
  description:
    'Version identifier for the Purpose form schema provided by this Knode (e.g., "1.0")',
  id: "PurposeFormSchemaVersion",
});

const API_LocalizedPurposeName = z
  .strictObject({
    en: z.string().min(minNameLength).max(maxNameLength),
  })
  .meta({
    description: "Name of the Purpose",
    id: "LocalizedPurposeName",
  });

const API_LocalizedPurposeDescription = z
  .strictObject({
    en: z.string().min(minDescriptionLength).max(maxDescriptionLength),
  })
  .meta({
    description: "Description of the Purpose",
    id: "LocalizedPurposeDescription",
  });

const API_PurposeFormAnswers = z.record(z.string(), z.unknown()).meta({
  description:
    "Key-value pairs representing the Consumer's answers to the Knode's purpose form",
  id: "PurposeFormAnswers",
});

const API_PurposeDailyCalls = z
  .int()
  .min(minDailyCalls)
  .max(maxDailyCalls)
  .meta({
    description: "Expected number of daily API calls for this Purpose",
    format: "int32",
  });

const API_PurposeTemplateReference = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({
    description: "Reference to a Purpose statement template",
    id: "PurposeTemplateReference",
  });

export const API_PurposeSeed = z
  .strictObject({
    consumerId: API_OrganizationId.meta({
      description:
        "Identifier of the Consumer Organization creating the Purpose",
    }),
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eserviceId: API_EserviceId.meta({
      description: "Identifier of the E-service this Purpose refers to",
    }),
    formAnswersJson: API_PurposeFormAnswers,
    formSchemaVersion: API_PurposeFormSchemaVersion,
    name: API_LocalizedPurposeName,
    template: API_PurposeTemplateReference.optional(),
  })
  .meta({
    description: "Seed data to create a new Purpose",
    id: "PurposeSeed",
  });
export type API_PurposeSeed = z.infer<typeof API_PurposeSeed>;

export const API_CreatedPurposeResource = API_CreatedResource.meta({
  description: "Unique identifier of the created Purpose resource",
  id: "CreatedPurposeResource",
});

export const API_PurposeIdPathParam = z.strictObject({
  purposeId: API_PurposeId,
});

const API_PurposeConsumer = z
  .strictObject({
    id: API_OrganizationId,
    knodeId: API_KnodeId,
  })
  .meta({
    description: "Consumer Organization of the Purpose",
    id: "PurposeConsumer",
  });

export const API_PurposeState = z
  .enum(["ACTIVE", "SUSPENDED", "ARCHIVED"])
  .meta({ description: "State of the Purpose", id: "PurposeState" });
export type API_PurposeState = z.infer<typeof API_PurposeState>;

export const API_Purpose = z
  .strictObject({
    // formAnswersJson and formSchemaVersion are intentionally excluded —
    // they can be retrieved via separate routes
    consumer: API_PurposeConsumer,
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eserviceId: API_EserviceId,
    id: API_PurposeId,
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
  .meta({
    description: "A Consumer's Purpose to access an E-service",
    id: "Purpose",
  });
export type API_Purpose = z.infer<typeof API_Purpose>;

const API_PurposeFormTexts = z
  .strictObject({
    en: z.record(z.string(), z.string()),
  })
  .meta({ id: "PurposeFormTexts" });

const API_PurposeFormUiTexts = z
  .strictObject({
    en: z.record(z.string(), z.string()),
  })
  .meta({ id: "PurposeFormUiTexts" });

export const API_PurposeFormSchemasResponse = z
  .strictObject({
    schema: z.record(z.string(), z.unknown()),
    texts: API_PurposeFormTexts,
    uiSchema: z.record(z.string(), z.unknown()),
    uiTexts: API_PurposeFormUiTexts,
    version: API_PurposeFormSchemaVersion,
  })
  .meta({
    description:
      "Current Purpose form schemas (JSON Schema + UI Schema + legal/UI texts) with their version identifier",
    id: "PurposeFormSchemasResponse",
  });
export type API_PurposeFormSchemasResponse = z.infer<
  typeof API_PurposeFormSchemasResponse
>;

export const API_Purposes = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_Purpose),
  })
  .meta({ id: "Purposes" });
export type API_Purposes = z.infer<typeof API_Purposes>;

export const API_GetPurposesQueryParams = API_PaginationQueryParams.extend({
  consumerId: API_OrganizationId.optional().meta({
    description: "Filter by Consumer ID",
  }),
  eserviceId: API_EserviceId.optional().meta({
    description: "Filter by E-service ID",
  }),
  state: arrayQueryParam(API_PurposeState).optional().meta({
    description: "Filter by Purpose State",
  }),
});
export type API_GetPurposesQueryParams = z.infer<
  typeof API_GetPurposesQueryParams
>;
