import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { z } from "zod";

export const API_Tenant = z
  .strictObject({
    createdAt: z.iso.datetime(),
    id: z.uuid(),
    name: z.string(),
  })
  .meta({ id: "Tenant" });
export type API_Tenant = z.infer<typeof API_Tenant>;

export const API_Tenants = z
  .strictObject({
    items: z.array(API_Tenant),
    pagination: API_Pagination,
  })
  .meta({ id: "Tenants" });
export type API_Tenants = z.infer<typeof API_Tenants>;

export const API_GetTenantsQueryParams = API_PaginationQueryParams.extend({
  q: z.string().optional().meta({ description: "Search by tenant name" }),
  sortBy: z
    .enum(["name"])
    .optional()
    .default("name")
    .meta({ description: "Field to sort by" }),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("asc")
    .meta({ description: "Sort direction" }),
});
export type API_GetTenantsQueryParams = z.infer<
  typeof API_GetTenantsQueryParams
>;
