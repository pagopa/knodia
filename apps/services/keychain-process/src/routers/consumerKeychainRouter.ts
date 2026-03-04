import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import type { ConsumerKeychainService } from "../services/consumerKeychainService.ts";

import {
  API_ConsumerKeychainSeed,
  API_GetConsumerKeychainsQueryParams,
  API_Keychain,
  API_Keychains,
} from "../models/api.ts";
import { toAPI_Keychain } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

export const consumerKeychainRouter: FastifyPluginAsyncZod<
  ConsumerKeychainService
> = async (fastify, consumerKeychainService) => {
  fastify.route({
    handler: async (req, res) => {
      const { results, totalCount } =
        await consumerKeychainService.getConsumerKeychains(
          req.query,
          getContextValues(requestContext),
        );

      res.status(200).send({
        items: results.map(toAPI_Keychain),
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Consumer Keychains",
      headers: KnodiaServiceHeaders,
      operationId: "getConsumerKeychains",
      querystring: API_GetConsumerKeychainsQueryParams,
      response: {
        200: API_Keychains.meta({
          description: "Consumer keychains retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumer-keychains",
  });

  fastify.route({
    handler: async (req, res) => {
      const consumerKeychain =
        await consumerKeychainService.createConsumerKeychain(
          req.body,
          getContextValues(requestContext),
        );
      res.status(201).send(toAPI_Keychain(consumerKeychain));
    },
    method: "POST",
    schema: {
      body: API_ConsumerKeychainSeed,
      description: "Create a new Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "createConsumerKeychain",
      response: {
        201: API_Keychain.meta({
          description: "Consumer Keychain created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumer-keychains",
  });
};
