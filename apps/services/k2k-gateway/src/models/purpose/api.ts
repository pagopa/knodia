import {
  API_CreatedResource,
  API_OrganizationId,
} from "@knodia/common-models/api";
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

export const API_PurposeSeed = z
  .strictObject({
    consumerId: API_OrganizationId.meta({
      description:
        "Identifier of the Consumer Organization creating the Purpose",
    }),
    dailyCalls: z.number().int().min(minDailyCalls).max(maxDailyCalls).meta({
      description: "Expected number of daily API calls for this Purpose",
      format: "int32",
    }),
    description: API_LocalizedPurposeDescription,
    eserviceId: API_EserviceId.meta({
      description: "Identifier of the E-service this Purpose refers to",
    }),
    formAnswersJson: API_PurposeFormAnswers,
    formSchemaVersion: API_PurposeFormSchemaVersion,
    name: API_LocalizedPurposeName,
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

export const API_PurposeFormSchemaResponse = z
  .strictObject({
    schema: z.record(z.string(), z.unknown()),
    version: API_PurposeFormSchemaVersion,
  })
  .meta({
    description:
      "Purpose form JSON Schema (Draft-07) with its version identifier",
    id: "PurposeFormSchemaResponse",
  });
export type API_PurposeFormSchemaResponse = z.infer<
  typeof API_PurposeFormSchemaResponse
>;

export const API_PurposeFormUiSchemaResponse = z
  .strictObject({
    uiSchema: z.record(z.string(), z.unknown()),
    version: API_PurposeFormSchemaVersion,
  })
  .meta({
    description: "Purpose form UI Schema with its version identifier",
    id: "PurposeFormUiSchemaResponse",
  });
export type API_PurposeFormUiSchemaResponse = z.infer<
  typeof API_PurposeFormUiSchemaResponse
>;
