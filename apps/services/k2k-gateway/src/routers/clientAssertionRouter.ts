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
  API_ClientAssertionVerificationRequest,
  API_ClientAssertionVerificationResponse,
} from "../models/clientAssertion/api.ts";
import { toAPI_ClientAssertionVerificationResponse } from "../models/clientAssertion/apiConverters.ts";
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
        "Verifying client assertion data for access token emission",
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const [, keyResponse, keychainResponse] = await Promise.all([
        // Verify purpose is linked to keychain, we just need a 200 and discard the return value
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
        toAPI_ClientAssertionVerificationResponse(
          keyResponse.data,
          organization,
        ),
      );
    },
    method: "POST",
    schema: {
      body: API_ClientAssertionVerificationRequest,
      description:
        "Verify that the key and purpose are associated with the consumer keychain, and return the public key and consumer attributes for further verification by the auth server",
      operationId: "getClientAssertionVerificationData",
      response: {
        200: API_ClientAssertionVerificationResponse.meta({
          description:
            "Client assertion verification data retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Get client assertion verification data",
      tags: [apiTags.operation],
    },
    url: "/clientAssertionVerificationData",
  });
};
