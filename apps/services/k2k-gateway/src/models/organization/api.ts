import {
  API_OrganizationId,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { API_Attribute } from "../attribute/api.ts";

export const API_Organization = z
  .strictObject({
    attributes: z.array(API_Attribute).meta({
      description: "Attributes associated with the Organization",
    }),
    id: API_OrganizationId,
    name: z.string().meta({
      description: "Human-readable name of the Organization",
    }),
  })
  .meta({ id: "Organization" });

export type API_Organization = z.infer<typeof API_Organization>;

export const API_OrganizationIdPathParam = z.strictObject({
  organizationId: API_OrganizationId,
});

export const API_GetOrganizationsQueryParams = API_PaginationQueryParams.extend(
  {
    name: z.string().optional().meta({
      description:
        "Filter by Organization name (case-insensitive substring match)",
    }),
    organizationId: arrayQueryParam(API_OrganizationId).optional().meta({
      description: "Filter by Organization ID",
    }),
  },
);
export type API_GetOrganizationsQueryParams = z.infer<
  typeof API_GetOrganizationsQueryParams
>;

export const API_Organizations = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_Organization),
  })
  .meta({ id: "Organizations" });
export type API_Organizations = z.infer<typeof API_Organizations>;
