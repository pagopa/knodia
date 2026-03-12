import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import { API_ConsumerKeychainIdPathParam } from "@knodia/keychain-models/api";
import {
  keychainProcessApi,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";
import { z } from "zod";

import { apiTags } from "../../models/apiTags.ts";
import { API_ConsumerKeychainSeed } from "../../models/keychain/api.ts";
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

      res.status(201).send({ id: data.id });
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

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Deleting Consumer Keychain with ID ${req.params.consumerKeychainId}`,
      );

      await keychainProcessApi.deleteConsumerKeychain({
        client: keychainProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { consumerKeychainId: req.params.consumerKeychainId },
      });

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Delete a Consumer Keychain",
      operationId: "deleteConsumerKeychain",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Consumer Keychain deleted successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId",
  });
};
