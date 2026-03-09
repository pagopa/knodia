import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import {
  API_AccessTokenType,
  API_EserviceAttribute,
  API_EserviceCategory,
  API_EserviceMode,
  API_EserviceVersionState,
  API_LocalizedDescription,
  API_LocalizedName,
} from "@knodia/eservice-models/api";
import { z } from "zod";

const API_EserviceSearchByKeywordsAndCategory = z.strictObject({
  category: API_EserviceCategory,
  keywords: z.string().min(1),
  knodeId: API_KnodeId,
});

const API_EserviceSearchByCategory =
  API_EserviceSearchByKeywordsAndCategory.pick({
    category: true,
    knodeId: true,
  });

const API_EserviceSearchByKeywords =
  API_EserviceSearchByKeywordsAndCategory.pick({
    keywords: true,
    knodeId: true,
  });

export const API_GetCatalogEserviceSearchParams = z
  .union([
    API_EserviceSearchByCategory,
    API_EserviceSearchByKeywords,
    API_EserviceSearchByKeywordsAndCategory,
  ])
  .meta({ id: "GetCatalogEserviceSearchParams" });
export type API_GetCatalogEserviceSearchParams = z.infer<
  typeof API_GetCatalogEserviceSearchParams
>;

export const API_CatalogEserviceSearchResult = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: API_LocalizedDescription,
    id: z.uuid(),
    latestVersionRequiredAttributes: z.array(z.array(API_EserviceAttribute)),
    latestVersionState: API_EserviceVersionState,
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producerId: z.uuid(),
  })
  .meta({ id: "CatalogEserviceSearchResult" });
export type API_CatalogEserviceSearchResult = z.infer<
  typeof API_CatalogEserviceSearchResult
>;

export const API_CatalogEserviceSearchResults = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_CatalogEserviceSearchResult),
  })
  .meta({ id: "CatalogEserviceSearchResults" });
export type API_CatalogEserviceSearchResults = z.infer<
  typeof API_CatalogEserviceSearchResults
>;

export const API_GetCatalogEservicesQueryParams = API_PaginationQueryParams;
export type API_GetCatalogEservicesQueryParams = z.infer<
  typeof API_GetCatalogEservicesQueryParams
>;

export const API_EserviceIdPathParam = z.strictObject({
  eserviceId: z.uuid().meta({
    description: "Unique identifier of the E-Service",
    id: "EserviceId",
  }),
});

export const API_GetEserviceDetailsQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetEserviceDetailsQueryParams = z.infer<
  typeof API_GetEserviceDetailsQueryParams
>;

const API_EserviceDetailsLatestVersion = z
  .strictObject({
    accessTokenAudience: z.array(z.string()),
    accessTokenDuration: z.number().int().meta({ format: "int32" }),
    accessTokenType: API_AccessTokenType,
    maxDailyCallsPerConsumer: z.number().int().meta({ format: "int32" }),
    maxDailyCallsPerKnode: z.number().int().meta({ format: "int32" }),
    requiredAttributes: z.array(z.array(API_EserviceAttribute)),
    state: API_EserviceVersionState,
  })
  .meta({ id: "EserviceDetailsLatestVersion" });

const API_EserviceDetailsInterfaceDocument = z
  .strictObject({
    checksum: z.string(),
    name: z.string(),
    prettyName: API_LocalizedName,
  })
  .meta({ id: "EserviceDetailsInterfaceDocument" });

const API_EserviceDetailsProducer = z
  .strictObject({
    email: z.string(),
    id: z.uuid(),
    knodeName: z.string(),
    name: API_LocalizedName,
    notes: z.string(),
  })
  .meta({ id: "EserviceDetailsProducer" });

export const API_EserviceDetails = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    description: API_LocalizedDescription,
    id: z.uuid(),
    interfaceDocument: API_EserviceDetailsInterfaceDocument,
    isConsumerOperatorIdentificationRequired: z.boolean(),
    isSignalHubEnabled: z.boolean(),
    latestVersion: API_EserviceDetailsLatestVersion,
    mode: API_EserviceMode,
    name: API_LocalizedName,
    producer: API_EserviceDetailsProducer,
  })
  .meta({ id: "EserviceDetails" });
export type API_EserviceDetails = z.infer<typeof API_EserviceDetails>;
