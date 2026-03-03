import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import type { TenantService } from "../services/tenantService.ts";

import { API_GetTenantsQueryParams, API_Tenants } from "../models/api.ts";
import { toAPI_Tenant } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

export const tenantRouter: FastifyPluginAsyncZod<TenantService> = async (
  fastify,
  tenantService,
) => {
  fastify.route({
    handler: async (req, res) => {
      const { results, totalCount } = await tenantService.getTenants(
        req.query,
        getContextValues(requestContext),
      );

      res.status(200).send({
        items: results.map(toAPI_Tenant),
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of tenants",
      headers: KnodiaServiceHeaders,
      operationId: "getTenants",
      querystring: API_GetTenantsQueryParams,
      response: {
        200: API_Tenants.meta({
          description: "Tenants retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      tags: [apiTags.tenant],
    },
    url: "/tenants",
  });
};
