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
  API_AccessTokenDataRequest,
  API_AccessTokenDataResponse,
  API_ConsumerKeychainIdPathParam,
} from "../models/consumerKeychain/api.ts";
import { toAPI_AccessTokenDataResponse } from "../models/consumerKeychain/apiConverters.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

interface ConsumerKeychainRouterOptions {
  callerKnodeId: KnodeId;
  keychainProcessClient: KeychainProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  tokenProvider: RefreshableInternalTokenGenerator;
}

export const consumerKeychainRouter: FastifyPluginAsyncZod<
  ConsumerKeychainRouterOptions
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
        { keychainId: req.params.keychainId, requestBody: req.body },
        "Getting access token data for consumer keychain",
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const [, keyResponse, keychainResponse] = await Promise.all([
        // Verify purpose is linked to keychain, we just need a 200 and discard the return value 
        keychainProcessApi.getConsumerKeychainPurpose({
          client: keychainProcessClient,
          headers,
          path: {
            consumerKeychainId: req.params.keychainId,
            purposeId: req.body.purposeId,
          },
          query: { knodeId: callerKnodeId },
        }),
        keychainProcessApi.getConsumerKeychainKey({
          client: keychainProcessClient,
          headers,
          path: {
            consumerKeychainId: req.params.keychainId,
            keyId: req.body.kid,
          },
        }),
        keychainProcessApi.getConsumerKeychain({
          client: keychainProcessClient,
          headers,
          path: { consumerKeychainId: req.params.keychainId },
        }),
      ]);

      const { data: organization } =
        await organizationProcessApi.getOrganization({
          client: organizationProcessClient,
          headers,
          path: { organizationId: keychainResponse.data.ownerId },
        });

      res.send(toAPI_AccessTokenDataResponse(keyResponse.data, organization));
    },
    method: "POST",
    schema: {
      body: API_AccessTokenDataRequest,
      description:
        "Retrieve consumer public key and attributes needed for access token emission",
      operationId: "getAccessTokenData",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        200: API_AccessTokenDataResponse.meta({
          description: "Access token data retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Get access token data",
      tags: [apiTags.operation, apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:keychainId/accessTokenData",
  });
};
