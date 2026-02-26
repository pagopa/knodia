import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  processHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import type { KeychainService } from "../services/keychainService.ts";

import { API_GetKeychainsQueryParams, API_Keychains } from "../models/api.ts";
import { toAPI_Keychain } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

export const keychainRouter: FastifyPluginAsyncZod<KeychainService> = async (
  fastify,
  keychainService,
) => {
  fastify.route({
    handler: async (req, res) => {
      const { results, totalCount } = await keychainService.getKeychains(
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
      description: "Retrieve a list of Keychains",
      headers: processHeaders,
      operationId: "getKeychains",
      querystring: API_GetKeychainsQueryParams,
      response: {
        200: API_Keychains.meta({
          description: "Keychains retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      tags: [apiTags.keychain],
    },
    url: "/keychains",
  });
};
