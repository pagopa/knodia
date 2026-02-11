import { API_EserviceCategory } from "@knodia/eservice-models/api";
import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/fastify-zod-api-commons/models";
import { z } from "zod";

const API_EserviceSearchByKeywords = z.strictObject({
  keywords: z.string().min(1),
});

const API_EserviceSearchByCategory = z.strictObject({
  category: API_EserviceCategory,
});

export const API_EserviceSearchParams = z
  .union([API_EserviceSearchByKeywords, API_EserviceSearchByCategory])
  .meta({ id: "EserviceSearchParams" });

export const API_EserviceSearchResults = z
  .strictObject({
    pagination: API_Pagination,
    // TODO: Replace `z.any()` with actual E-Service result schema once defined
    results: z.array(z.any()),
  })
  .meta({ id: "EserviceSearchResults" });
export type API_EserviceSearchResults = z.infer<
  typeof API_EserviceSearchResults
>;

export const API_SearchEservicesQueryParams = API_PaginationQueryParams;
export type API_SearchEservicesQueryParams = z.infer<
  typeof API_SearchEservicesQueryParams
>;
