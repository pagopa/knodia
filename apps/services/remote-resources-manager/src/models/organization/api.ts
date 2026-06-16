import { API_Attribute } from "@knodia/attribute-models/api";
import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

export const API_Organization = z
  .strictObject({
    attributes: z.array(API_Attribute),
    id: z.uuid(),
    knodeId: API_KnodeId.meta({
      description: "Knode ID of the Knode this Organization belongs to",
    }),
    name: z.string(),
  })
  .meta({ id: "Organization" });
export type API_Organization = z.infer<typeof API_Organization>;

export const API_GetOrganizationQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetOrganizationQueryParams = z.infer<
  typeof API_GetOrganizationQueryParams
>;

export const API_GetOrganizationsQueryParams = API_PaginationQueryParams.extend(
  {
    knodeId: API_KnodeId,
    organizationId: arrayQueryParam(z.uuid()).optional().meta({
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
