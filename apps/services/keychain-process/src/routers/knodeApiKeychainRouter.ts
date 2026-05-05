import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
  MetadataVersionHeader,
  setMetadataVersionHeader,
} from "@knodia/fastify-zod-api-commons/models";

import type { KnodeApiKeychainService } from "../services/knodeApiKeychainService.ts";

import { API_Keychain, API_KnodeApiKeychainSeed } from "../models/api.ts";
import { toAPI_KnodeApiKeychain } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface KnodeApiKeychainRouterOptions {
  knodeApiKeychainService: KnodeApiKeychainService;
}

export const knodeApiKeychainRouter: FastifyPluginAsyncZod<
  KnodeApiKeychainRouterOptions
> = async (fastify, { knodeApiKeychainService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: knodeApiKeychain,
        metadata: { version },
      } = await knodeApiKeychainService.createKnodeApiKeychain(req.body, ctx);

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_KnodeApiKeychain(knodeApiKeychain));
    },
    method: "POST",
    schema: {
      body: API_KnodeApiKeychainSeed,
      description: "Create a new Knode API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "createKnodeApiKeychain",
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Knode API Keychain created successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains",
  });
};
