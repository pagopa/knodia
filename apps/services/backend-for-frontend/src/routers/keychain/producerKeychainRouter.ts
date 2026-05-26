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
import {
  API_Keychains,
  API_KeychainSeed,
  API_ProducerKeychainsQueryParams,
} from "../../models/keychain/api.ts";
import { toAPI_Keychain } from "../../models/keychain/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

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

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: ownerId } = getUISessionAuthData(authData);
      const { limit, offset } = req.query;

      logger.info(
        { ownerId, requestQuery: req.query },
        `Getting Producer Keychains with query parameters for owner ${ownerId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data } = await keychainProcessApi.getProducerKeychains({
        client: keychainProcessClient,
        headers,
        query: { limit, offset, ownerId },
      });

      res.send({
        pagination: data.pagination,
        // TODO(KN-673): populate counters once Producer Keychain
        // keys/members listing endpoints are available (see KN-642).
        results: data.results.map((keychain) =>
          toAPI_Keychain(keychain, { keysCount: 0, membersCount: 0 }),
        ),
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a paginated list of Producer Keychains owned by the current user organization",
      operationId: "getProducerKeychains",
      querystring: API_ProducerKeychainsQueryParams,
      response: {
        200: API_Keychains.meta({
          description: "Producer Keychains retrieved successfully",
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
