import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import {
  keychainProcessApi,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";

import { API_ConsumerKeychainSeed } from "../../models/api.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface ConsumerKeychainRouterOptions {
  keychainProcessClient: KeychainProcessClient;
}

export const consumerKeychainRouter: FastifyPluginAsyncZod<
  ConsumerKeychainRouterOptions
> = async (fastify, { keychainProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Creating new Consumer Keychain with body data",
      );

      const { data } = await keychainProcessApi.createConsumerKeychain({
        body: req.body,
        client: keychainProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
      });

      res.status(201).send(API_CreatedResource.parse({ id: data.id }));
    },
    method: "POST",
    schema: {
      body: API_ConsumerKeychainSeed,
      description: "Create a new Consumer Keychain",
      operationId: "createConsumerKeychain",
      response: {
        201: API_CreatedResource.meta({
          description: "Consumer Keychain created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains",
  });
};
