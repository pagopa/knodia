import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import { apiTags } from "../../models/apiTags.ts";
import { API_PurposeSeed } from "../../models/purpose/api.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface PurposeConsumerRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const purposeConsumerRouter: FastifyPluginAsyncZod<
  PurposeConsumerRouterOptions
> = async (fastify, { remoteResourcesManagerClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);

      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { consumerId, requestBody: req.body },
        `Creating Purpose for consumer ${consumerId} on knode ${req.body.knodeId}`,
      );

      const { data } = await remoteResourcesManagerApi.createPurpose({
        body: req.body,
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
      });

      res.status(201).send({ id: data.id });
    },
    method: "POST",
    schema: {
      body: API_PurposeSeed,
      description: "Create a new Purpose for an E-service",
      operationId: "createConsumerPurpose",
      response: {
        201: API_CreatedResource.meta({
          description: "Purpose created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Create a consumer purpose",
      tags: [apiTags.purpose],
    },
    url: "/consumer/purposes",
  });
};
