import { API_Attribute } from "@knodia/attribute-models/api";
import {
  API_Pagination,
  API_PaginationQueryParams,
  API_UserId,
} from "@knodia/common-models/api";
import { UserRole } from "@knodia/common-models/auth";
import { arrayQueryParam } from "@knodia/fastify-zod-api-commons/models";
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
    pagination: API_Pagination,
    results: z.array(API_Organization),
  })
  .meta({ id: "Organizations" });
export type API_Organizations = z.infer<typeof API_Organizations>;

export const API_Operator = z
  .strictObject({
    email: z.string(),
    id: API_UserId,
    roles: z.array(UserRole),
    username: z.string(),
  })
  .meta({ id: "Operator" });
export type API_Operator = z.infer<typeof API_Operator>;

export const API_Operators = z.array(API_Operator).meta({ id: "Operators" });
export type API_Operators = z.infer<typeof API_Operators>;

export const API_GetOrganizationsQueryParams = API_PaginationQueryParams.extend(
  {
    organizationId: arrayQueryParam(z.uuid()).optional().meta({
      description: "Filter by Organization ID",
    }),
  },
);
export type API_GetOrganizationsQueryParams = z.infer<
  typeof API_GetOrganizationsQueryParams
>;

export const API_OrganizationSeed = z
  .strictObject({
    attributes: z.array(API_Attribute),
    externalRequestId: z.uuid().optional().meta({
      description:
        "Idempotency key. A repeated request with the same key returns the already-created Organization instead of a duplicate. Deduplication relies on the eventually-consistent readmodel, so a redelivery racing ahead of projection may still create a second Organization.",
    }),
    name: z.string().min(1),
  })
  .meta({ id: "OrganizationSeed" });
export type API_OrganizationSeed = z.infer<typeof API_OrganizationSeed>;
