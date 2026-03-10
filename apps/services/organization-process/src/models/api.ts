import { API_Attribute } from "@knodia/attribute-models/api";
import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { z } from "zod";

export const API_Organization = z
  .strictObject({
    attributes: z.array(API_Attribute),
    createdAt: z.iso.datetime(),
    id: z.uuid(),
    name: z.string(),
    updatedAt: z.iso.datetime(),
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

export const API_GetOrganizationsQueryParams = API_PaginationQueryParams;
export type API_GetOrganizationsQueryParams = z.infer<
  typeof API_GetOrganizationsQueryParams
>;
