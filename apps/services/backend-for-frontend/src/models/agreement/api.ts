import { API_AgreementState } from "@knodia/agreement-models/api";
import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import {
  API_EserviceCategory,
  API_EserviceMode,
  API_EserviceVersionState,
  API_LocalizedName,
} from "@knodia/eservice-models/api";
import { API_CompactOrganization } from "@knodia/organization-models/api";
import z from "zod";

import { API_CompactEservice } from "../eservice/api.ts";

export const API_CompactAgreement = z
  .strictObject({
    id: z.uuid(),
    state: API_AgreementState,
  })
  .meta({
    description: "Agreement with only id and state",
    id: "CompactAgreement",
  });

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

export const API_SuspendReactivateAgreementByConsumerQueryParams =
  z.strictObject({
    knodeId: API_KnodeId,
  });

export const API_CreateAgreementConsumerActivationMagicLinkQueryParams =
  z.strictObject({
    knodeId: API_KnodeId,
  });

export const API_GetProducerAgreementsQueryParams =
  API_PaginationQueryParams.extend({
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
          "Filter to only Agreements updated within the recent update window",
      }),
  });
export type API_GetProducerAgreementsQueryParams = z.infer<
  typeof API_GetProducerAgreementsQueryParams
>;

export const API_ProducerAgreement = z
  .strictObject({
    consumer: API_CompactOrganization,
    eservice: API_CompactEservice,
    hasRecentlyBeenUpdated: z.boolean().meta({
      description: "Indicates whether the Agreement has been recently updated",
    }),
    id: z.uuid(),
    state: API_AgreementState,
  })
  .meta({ id: "ProducerAgreement" });
export type API_ProducerAgreement = z.infer<typeof API_ProducerAgreement>;

export const API_ProducerAgreementDetails = API_ProducerAgreement.omit({
  hasRecentlyBeenUpdated: true,
})
  .extend({
    latestEserviceVersionState: API_EserviceVersionState,
    producer: API_CompactOrganization,
    suspendedByConsumerAt: z.string().datetime().nullable(),
    suspendedByProducerAt: z.string().datetime().nullable(),
  })
  .meta({ id: "ProducerAgreementDetails" });
export type API_ProducerAgreementDetails = z.infer<
  typeof API_ProducerAgreementDetails
>;

export const API_ProducerAgreements = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_ProducerAgreement),
  })
  .meta({ id: "ProducerAgreements" });
export type API_ProducerAgreements = z.infer<typeof API_ProducerAgreements>;

export const API_ConsumerAgreements = z
  .strictObject({
    counters: z.strictObject({
      activeAgreements: z
        .number()
        .int()
        .min(0)
        .meta({ description: "Number of active agreements", format: "int32" }),
      archivedAgreements: z.number().int().min(0).meta({
        description: "Number of archived agreements",
        format: "int32",
      }),
      suspendedAgreements: z.number().int().min(0).meta({
        description: "Number of suspended agreements",
        format: "int32",
      }),
    }),
  })
  .meta({ id: "ConsumerAgreements" });
export type API_ConsumerAgreements = z.infer<typeof API_ConsumerAgreements>;

export const API_PendingConsumerAgreement = z
  .strictObject({
    eservice: z.strictObject({
      categories: z.array(API_EserviceCategory),
      id: z.uuid(),
      mode: API_EserviceMode,
      name: API_LocalizedName,
      state: API_EserviceVersionState,
    }),
    hasRecentlyBeenUpdated: z.boolean().meta({
      description:
        "Indicates whether the Agreement or its E-service has been recently updated",
    }),
    id: z.uuid(),
    producer: API_CompactOrganization,
  })
  .meta({ id: "PendingConsumerAgreement" });
export type API_PendingConsumerAgreement = z.infer<
  typeof API_PendingConsumerAgreement
>;

export const API_PendingConsumerAgreements = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_PendingConsumerAgreement),
  })
  .meta({ id: "PendingConsumerAgreements" });
export type API_PendingConsumerAgreements = z.infer<
  typeof API_PendingConsumerAgreements
>;

export const API_GetPendingConsumerAgreementsQueryParams =
  API_PaginationQueryParams;
export type API_GetPendingConsumerAgreementsQueryParams = z.infer<
  typeof API_GetPendingConsumerAgreementsQueryParams
>;
