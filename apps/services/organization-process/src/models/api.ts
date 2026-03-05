import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { z } from "zod";

const API_OrganizationAttribute = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .meta({ id: "OrganizationAttribute" });
type API_OrganizationAttribute = z.infer<typeof API_OrganizationAttribute>;

export const API_Organization = z
  .strictObject({
    attributes: z.array(API_OrganizationAttribute),
    createdAt: z.iso.datetime(),
    id: z.uuid(),
    name: z.string(),
  })
  .meta({ id: "Organization" });
export type API_Organization = z.infer<typeof API_Organization>;

export const API_Organizations = z
  .strictObject({
    items: z.array(API_Organization),
    pagination: API_Pagination,
  })
  .meta({ id: "Organizations" });
export type API_Organizations = z.infer<typeof API_Organizations>;

export const API_GetOrganizationsQueryParams = API_PaginationQueryParams.extend(
  {
    q: z
      .string()
      .optional()
      .meta({ description: "Search by organization name" }),
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
  },
);
export type API_GetOrganizationsQueryParams = z.infer<
  typeof API_GetOrganizationsQueryParams
>;
