import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import { generateId, type PurposeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { apiTags } from "../../models/apiTags.ts";
import { API_PurposeSeed } from "../../models/purpose/api.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

export const purposeConsumerRouter: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, logger } = getContextValues(requestContext);

      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { consumerId, requestBody: req.body },
        `Creating Purpose for consumer ${consumerId} on knode ${req.body.knodeId}`,
      );

      // TODO: call remoteResourcesManagerApi.createPurpose(...) when RRM/k2k layers exist
      const id = generateId<PurposeId>();

      res.status(201).send({ id });
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
      },
      tags: [apiTags.purpose],
    },
    url: "/consumer/purposes",
  });
};
