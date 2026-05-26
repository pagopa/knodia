import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  keychainProcessApi,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";

import { apiTags } from "../../models/apiTags.ts";
import { API_KeychainSeed } from "../../models/keychain/api.ts";

interface ProducerKeychainRouterOptions {
  keychainProcessClient: KeychainProcessClient;
}

export const producerKeychainRouter: FastifyPluginAsyncZod<
  ProducerKeychainRouterOptions
> = async (fastify, { keychainProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Creating new Producer Keychain with body data",
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.createProducerKeychain({
        body: req.body,
        client: keychainProcessClient,
        headers,
      });

      res.status(201).send({ id: response.data.id });
    },
    method: "POST",
    schema: {
      body: API_KeychainSeed,
      description: "Create a new Producer Keychain",
      operationId: "createProducerKeychain",
      response: {
        201: API_CreatedResource.meta({
          description: "Producer Keychain created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains",
  });
};
