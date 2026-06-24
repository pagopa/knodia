import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_GetOrganizationsQueryParams,
  API_Organizations,
} from "../../models/organization/api.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

interface OrganizationRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const organizationRouter: FastifyPluginAsyncZod<
  OrganizationRouterOptions
> = async (fastify, { remoteResourcesManagerClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      getUISessionAuthData(authData);

      logger.info(
        { requestQuery: req.query },
        `Getting Organizations owned by Knode ${req.query.knodeId}`,
      );

      const { data } = await remoteResourcesManagerApi.getOrganizations({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: req.query,
      });

      res.send({ pagination: data.pagination, results: data.results });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a list of Organizations owned by a Knode, optionally filtered by name",
      operationId: "getOrganizations",
      querystring: API_GetOrganizationsQueryParams,
      response: {
        200: API_Organizations.meta({
          description: "Organizations retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      tags: [apiTags.organization],
    },
    url: "/organizations",
  });
};
