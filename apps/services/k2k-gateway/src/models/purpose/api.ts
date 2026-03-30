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
import { API_KnodeId } from "../knode/api.ts";

const API_PurposeId = z.uuid().meta({
  description: "Unique identifier of the Purpose",
  id: "PurposeId",
});

const API_PurposeFormSchemaVersion = z.enum(["1.0"]).meta({
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

const API_PurposeState = z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]).meta({
  description: "Describes the states a Purpose can be in",
  id: "PurposeState",
});
export type API_PurposeState = z.infer<typeof API_PurposeState>;

export const API_Purpose = z
  .strictObject({
    // formAnswersJson and formSchemaVersion are intentionally excluded —
    // they can be retrieved via separate routes
    consumer: API_PurposeConsumer,
    dailyCalls: API_PurposeDailyCalls,
    description: API_LocalizedPurposeDescription,
    eserviceId: API_EserviceId,
    formSchemaVersion: API_PurposeFormSchemaVersion,
    id: API_PurposeId,
    name: API_LocalizedPurposeName,
    state: API_PurposeState,
    updatedAt: z.iso.datetime(),
  })
  .meta({
    description: "A Consumer's Purpose to access an E-service",
    id: "Purpose",
  });
export type API_Purpose = z.infer<typeof API_Purpose>;
