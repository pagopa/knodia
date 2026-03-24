import { API_AgreementState } from "@knodia/agreement-models/api";
import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { API_EserviceVersionState } from "@knodia/eservice-models/api";
import { API_CompactOrganization } from "@knodia/organization-models/api";
import z from "zod";

import { API_CompactEservice } from "../eservice/api.ts";

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

export const API_GetProducerAgreementsQueryParams = API_PaginationQueryParams;
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

export const API_ProducerAgreementDetails = API_ProducerAgreement.extend({
  latestEserviceVersionState: API_EserviceVersionState,
  producer: API_CompactOrganization,
}).meta({ id: "ProducerAgreementDetails" });
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
    // TODO: add results (agreements with needed action)
  })
  .meta({ id: "ConsumerAgreements" });
export type API_ConsumerAgreements = z.infer<typeof API_ConsumerAgreements>;
