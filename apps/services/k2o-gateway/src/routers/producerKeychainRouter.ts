import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  keychainProcessApi,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";

import { API_KeyIdPathParam, API_PublicKey } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";

interface ProducerKeychainRouterOptions {
  keychainProcessClient: KeychainProcessClient;
}

export const producerKeychainRouter: FastifyPluginAsyncZod<
  ProducerKeychainRouterOptions
> = async (fastify, { keychainProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "knode-api" },
      ]);
      const { correlationId, logger } = ctx;

      logger.info(
        { requestParams: req.params },
        `Getting Public Key with KID ${req.params.keyId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data } = await keychainProcessApi.getProducerKey({
        client: keychainProcessClient,
        headers,
        path: { keyId: req.params.keyId },
      });

      res.send(data);
    },
    method: "GET",
    schema: {
      description: "Retrieve a Producer Public Key",
      operationId: "getProducerPublicKey",
      params: API_KeyIdPathParam,
      response: {
        200: API_PublicKey.meta({
          description: "Producer Public Key retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Producer Public Key not found" }),
      },
      summary: "Get Producer Public Key",
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeys/:keyId",
  });
};
