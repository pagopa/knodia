import type { KnodeId } from "@knodia/common-models/ids";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import {
  keychainProcessApi,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";

import { apiTags } from "../models/apiTags.ts";
import {
  API_ConsumerClientAssertionVerificationRequest,
  API_ConsumerClientAssertionVerificationResponse,
  API_KnodeApiClientAssertionVerificationRequest,
  API_KnodeApiClientAssertionVerificationResponse,
} from "../models/clientAssertion/api.ts";
import {
  toAPI_ConsumerClientAssertionVerificationResponse,
  toAPI_KnodeApiClientAssertionVerificationResponse,
} from "../models/clientAssertion/apiConverters.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

interface ClientAssertionRouterOptions {
  callerKnodeId: KnodeId;
  keychainProcessClient: KeychainProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  tokenProvider: RefreshableInternalTokenGenerator;
}

export const clientAssertionRouter: FastifyPluginAsyncZod<
  ClientAssertionRouterOptions
> = async (
  fastify,
  {
    callerKnodeId,
    keychainProcessClient,
    organizationProcessClient,
    tokenProvider,
  },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Verifying client assertion data for E-service access token emission",
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const [, keyResponse, keychainResponse] = await Promise.all([
        // Verify purpose is linked to Consumer Keychain, we just need a 200 and discard the return value
        keychainProcessApi.getConsumerKeychainPurpose({
          client: keychainProcessClient,
          headers,
          path: {
            consumerKeychainId: req.body.keychainId,
            purposeId: req.body.purposeId,
          },
          query: { knodeId: callerKnodeId },
        }),
        keychainProcessApi.getConsumerKeychainKey({
          client: keychainProcessClient,
          headers,
          path: {
            consumerKeychainId: req.body.keychainId,
            keyId: req.body.kid,
          },
        }),
        keychainProcessApi.getConsumerKeychain({
          client: keychainProcessClient,
          headers,
          path: { consumerKeychainId: req.body.keychainId },
        }),
      ]);

      const { data: organization } =
        await organizationProcessApi.getOrganization({
          client: organizationProcessClient,
          headers,
          path: { organizationId: keychainResponse.data.ownerId },
        });

      res.send(
        toAPI_ConsumerClientAssertionVerificationResponse(
          keyResponse.data,
          organization,
        ),
      );
    },
    method: "POST",
    schema: {
      body: API_ConsumerClientAssertionVerificationRequest,
      description:
        "Verify that the key and purpose are associated with the Consumer Keychain, and return the public key and consumer attributes for further verification by the auth server",
      operationId: "getConsumerClientAssertionVerificationData",
      response: {
        200: API_ConsumerClientAssertionVerificationResponse.meta({
          description:
            "Consumer client assertion verification data retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary:
        "Get Consumer client assertion verification data for E-service access token emission",
      tags: [apiTags.operation],
    },
    url: "/consumerClientAssertionVerificationData",
  });
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Verifying client assertion data for Knode API access token emission",
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const [keyResponse, keychainResponse] = await Promise.all([
        keychainProcessApi.getKnodeApiKeychainKey({
          client: keychainProcessClient,
          headers,
          path: {
            keyId: req.body.kid,
            knodeApiKeychainId: req.body.keychainId,
          },
        }),
        keychainProcessApi.getKnodeApiKeychain({
          client: keychainProcessClient,
          headers,
          path: { knodeApiKeychainId: req.body.keychainId },
        }),
      ]);

      res.send(
        toAPI_KnodeApiClientAssertionVerificationResponse(
          keyResponse.data,
          keychainResponse.data,
        ),
      );
    },
    method: "POST",
    schema: {
      body: API_KnodeApiClientAssertionVerificationRequest,
      description:
        "Verify that the key is associated with the Knode API Keychain, and return the public key for further verification by the auth server",
      operationId: "getKnodeApiClientAssertionVerificationData",
      response: {
        200: API_KnodeApiClientAssertionVerificationResponse.meta({
          description:
            "Knode API client assertion verification data retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary:
        "Get Knode API client assertion verification data for Knode API access token emission",
      tags: [apiTags.operation],
    },
    url: "/knodeApiClientAssertionVerificationData",
  });
};
