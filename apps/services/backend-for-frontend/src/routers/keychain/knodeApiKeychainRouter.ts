import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  API_CreatedResource,
  API_FileDownload,
} from "@knodia/common-models/api";
import {
  type KnodeApiKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { sendFileDownload } from "@knodia/fastify-zod-api-commons/http";
import {
  API_Problem,
  getKnodiaServiceHeaders,
  type KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import { API_KnodeApiKeychainIdPathParam } from "@knodia/keychain-models/api";
import {
  keychainProcessApi,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import {
  isPolledVersionAtLeastResponseVersion,
  type PollingService,
} from "@knodia/polling";
import { type AxiosResponse } from "axios";
import { z } from "zod";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_CreatedKeyResource,
  API_GetKnodeApiKeychainKeysQueryParams,
  API_GetKnodeApiKeychainMembersQueryParams,
  type API_Keychain,
  API_KeychainDetails,
  API_KeychainKeys,
  API_KeychainKeySeed,
  API_KeychainMembers,
  API_KeychainMemberSeed,
  API_Keychains,
  API_KnodeApiKeychainKeyPathParams,
  API_KnodeApiKeychainMemberPathParams,
  API_KnodeApiKeychainMembershipCheckResult,
  API_KnodeApiKeychainPatch,
  API_KnodeApiKeychainSeed,
  API_KnodeApiKeychainsQueryParams,
} from "../../models/keychain/api.ts";
import {
  toAPI_Keychain,
  toAPI_KeychainDetails,
  toAPI_KeychainKey,
  toAPI_User,
} from "../../models/keychain/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { resourceExists } from "../../utils/resourceExists.ts";

interface KnodeApiKeychainRouterOptions {
  keychainProcessClient: KeychainProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  pollingService: PollingService;
}

export const knodeApiKeychainRouter: FastifyPluginAsyncZod<
  KnodeApiKeychainRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (
  fastify,
  { keychainProcessClient, organizationProcessClient, pollingService },
) => {
  const retrieveKnodeApiKeychainById = async (
    knodeApiKeychainId: KnodeApiKeychainId,
    headers: KnodiaServiceHeaders,
  ) =>
    await keychainProcessApi.getKnodeApiKeychain({
      client: keychainProcessClient,
      headers,
      path: { knodeApiKeychainId },
    });

  const pollKnodeApiKeychain = <TResponseBody>(
    response: AxiosResponse<TResponseBody>,
    headers: KnodiaServiceHeaders,
    knodeApiKeychainId: KnodeApiKeychainId,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrieveKnodeApiKeychainById(knodeApiKeychainId, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });

  const pollKnodeApiKeychainUntilDeletion = (
    knodeApiKeychainId: KnodeApiKeychainId,
    headers: KnodiaServiceHeaders,
  ) =>
    pollingService.pollResourceUntilDeletion(() =>
      retrieveKnodeApiKeychainById(knodeApiKeychainId, headers),
    )();

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Creating new Knode API Keychain with body data",
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.createKnodeApiKeychain({
        body: req.body,
        client: keychainProcessClient,
        headers,
      });

      await pollKnodeApiKeychain(
        response,
        headers,
        unsafeBrandId<KnodeApiKeychainId>(response.data.id),
      );

      res.status(201).send({ id: response.data.id });
    },
    method: "POST",
    schema: {
      body: API_KnodeApiKeychainSeed,
      description: "Create a new Knode API Keychain",
      operationId: "createKnodeApiKeychain",
      response: {
        201: API_CreatedResource.meta({
          description: "Knode API Keychain created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: ownerId } = getUISessionAuthData(authData);
      const { limit, offset } = req.query;
      const headers = getKnodiaServiceHeaders(req, correlationId);

      logger.info(
        { ownerId, requestQuery: req.query },
        `Getting Knode API Keychains with query parameters for owner ${ownerId}`,
      );

      async function enhanceKeychainWithCounts(
        keychain: keychainProcessApi.Keychain,
      ): Promise<API_Keychain> {
        const [{ data: keys }, { data: members }] = await Promise.all([
          keychainProcessApi.getKnodeApiKeychainKeys({
            client: keychainProcessClient,
            headers,
            path: { knodeApiKeychainId: keychain.id },
            query: { limit: 1, offset: 0 },
          }),
          keychainProcessApi.getKnodeApiKeychainMembers({
            client: keychainProcessClient,
            headers,
            path: { knodeApiKeychainId: keychain.id },
            query: { limit: 1, offset: 0 },
          }),
        ]);

        return toAPI_Keychain(keychain, {
          keysCount: keys.pagination.total,
          membersCount: members.pagination.total,
        });
      }

      const { data } = await keychainProcessApi.getKnodeApiKeychains({
        client: keychainProcessClient,
        headers,
        query: { limit, offset, ownerId },
      });

      res.send({
        pagination: data.pagination,
        results: await Promise.all(
          data.results.map((keychain) => enhanceKeychainWithCounts(keychain)),
        ),
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a paginated list of Knode API Keychains owned by the current user organization",
      operationId: "getKnodeApiKeychains",
      querystring: API_KnodeApiKeychainsQueryParams,
      response: {
        200: API_Keychains.meta({
          description: "Knode API Keychains retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Getting Knode API Keychain details with ID ${req.params.knodeApiKeychainId}`,
      );

      const { data: knodeApiKeychain } =
        await keychainProcessApi.getKnodeApiKeychain({
          client: keychainProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { knodeApiKeychainId: req.params.knodeApiKeychainId },
        });

      res.send(toAPI_KeychainDetails(knodeApiKeychain));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Knode API Keychain with all its details",
      operationId: "getKnodeApiKeychainDetails",
      params: API_KnodeApiKeychainIdPathParam,
      response: {
        200: API_KeychainDetails.meta({
          description: "Knode API Keychain details retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body, requestParams: req.params },
        `Updating Knode API Keychain with ID ${req.params.knodeApiKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.updateKnodeApiKeychain({
        body: req.body,
        client: keychainProcessClient,
        headers,
        path: { knodeApiKeychainId: req.params.knodeApiKeychainId },
      });

      await pollKnodeApiKeychain(
        response,
        headers,
        req.params.knodeApiKeychainId,
      );

      res.status(204).send();
    },
    method: "PATCH",
    schema: {
      body: API_KnodeApiKeychainPatch,
      consumes: ["application/merge-patch+json"],
      description: "Update a Knode API Keychain",
      operationId: "updateKnodeApiKeychain",
      params: API_KnodeApiKeychainIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Knode API Keychain updated successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Deleting Knode API Keychain with ID ${req.params.knodeApiKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      await keychainProcessApi.deleteKnodeApiKeychain({
        client: keychainProcessClient,
        headers,
        path: { knodeApiKeychainId: req.params.knodeApiKeychainId },
      });

      await pollKnodeApiKeychainUntilDeletion(
        req.params.knodeApiKeychainId,
        headers,
      );

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Delete a Knode API Keychain",
      operationId: "deleteKnodeApiKeychain",
      params: API_KnodeApiKeychainIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Knode API Keychain deleted successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { limit, offset } = req.query;

      logger.info(
        { requestParams: req.params, requestQuery: req.query },
        `Getting Knode API Keychain keys with ID ${req.params.knodeApiKeychainId}`,
      );

      const [{ data: keys }, { data: operator }] = await Promise.all([
        keychainProcessApi.getKnodeApiKeychainKeys({
          client: keychainProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { knodeApiKeychainId: req.params.knodeApiKeychainId },
          query: { limit, offset },
        }),
        organizationProcessApi.getOperators({
          client: organizationProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
        }),
      ]);

      res.send({
        pagination: keys.pagination,
        results: keys.results.map((key) => toAPI_KeychainKey(key, operator)),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve keys of a Knode API Keychain",
      operationId: "getKnodeApiKeychainKeys",
      params: API_KnodeApiKeychainIdPathParam,
      querystring: API_GetKnodeApiKeychainKeysQueryParams,
      response: {
        200: API_KeychainKeys.meta({
          description: "Knode API Keychain Keys retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/keys",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { keyId, knodeApiKeychainId } = req.params;

      logger.info(
        { requestParams: req.params },
        `Downloading key ${keyId} from Knode API Keychain with ID ${knodeApiKeychainId}`,
      );

      const { data: key } = await keychainProcessApi.getKnodeApiKeychainKey({
        client: keychainProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { keyId, knodeApiKeychainId },
      });

      const content = Buffer.from(key.encodedPem, "base64");

      sendFileDownload(
        res,
        content,
        `public_key_${keyId}.pem`,
        "text/plain; charset=utf-8",
      );
    },
    method: "GET",
    schema: {
      description: "Download a Knode API Keychain Key",
      operationId: "downloadKnodeApiKeychainKey",
      params: API_KnodeApiKeychainKeyPathParams,
      response: {
        200: API_FileDownload.meta({
          description: "Knode API Keychain Key downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Knode API Keychain Key not found",
        }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/keys/:keyId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { knodeApiKeychainId } = req.params;

      logger.info(
        { requestBody: req.body, requestParams: req.params },
        `Uploading key to Knode API Keychain with ID ${knodeApiKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.uploadKnodeApiKeychainKey({
        body: req.body,
        client: keychainProcessClient,
        headers,
        path: { knodeApiKeychainId },
      });

      await pollKnodeApiKeychain(response, headers, knodeApiKeychainId);

      res.status(201).send({ kid: response.data.kid });
    },
    method: "POST",
    schema: {
      body: API_KeychainKeySeed,
      description: "Upload a key to a Knode API Keychain",
      operationId: "uploadKnodeApiKeychainKey",
      params: API_KnodeApiKeychainIdPathParam,
      response: {
        201: API_CreatedKeyResource.meta({
          description: "Knode API Keychain Key uploaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/keys",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { keyId, knodeApiKeychainId } = req.params;

      logger.info(
        { requestParams: req.params },
        `Removing key ${keyId} from Knode API Keychain with ID ${knodeApiKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.removeKnodeApiKeychainKey({
        client: keychainProcessClient,
        headers,
        path: { keyId, knodeApiKeychainId },
      });

      await pollKnodeApiKeychain(response, headers, knodeApiKeychainId);

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a key from a Knode API Keychain",
      operationId: "removeKnodeApiKeychainKey",
      params: API_KnodeApiKeychainKeyPathParams,
      response: {
        204: z.undefined().meta({
          description: "Knode API Keychain Key removed successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/keys/:keyId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { limit, offset } = req.query;

      logger.info(
        { requestParams: req.params, requestQuery: req.query },
        `Getting Knode API Keychain members with ID ${req.params.knodeApiKeychainId}`,
      );

      const { data: members } =
        await keychainProcessApi.getKnodeApiKeychainMembers({
          client: keychainProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { knodeApiKeychainId: req.params.knodeApiKeychainId },
          query: { limit, offset },
        });

      res.send({
        pagination: members.pagination,
        results: members.results.map(toAPI_User),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve members of a Knode API Keychain",
      operationId: "getKnodeApiKeychainMembers",
      params: API_KnodeApiKeychainIdPathParam,
      querystring: API_GetKnodeApiKeychainMembersQueryParams,
      response: {
        200: API_KeychainMembers.meta({
          description: "Knode API Keychain Members retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/members",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body, requestParams: req.params },
        `Adding member to Knode API Keychain with ID ${req.params.knodeApiKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.addKnodeApiKeychainMember({
        body: req.body,
        client: keychainProcessClient,
        headers,
        path: { knodeApiKeychainId: req.params.knodeApiKeychainId },
      });

      await pollKnodeApiKeychain(
        response,
        headers,
        req.params.knodeApiKeychainId,
      );

      res.status(204).send();
    },
    method: "POST",
    schema: {
      body: API_KeychainMemberSeed,
      description: "Add a member to a Knode API Keychain",
      operationId: "addKnodeApiKeychainMember",
      params: API_KnodeApiKeychainIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Knode API Keychain Member added successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/members",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Removing member ${req.params.userId} from Knode API Keychain with ID ${req.params.knodeApiKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.removeKnodeApiKeychainMember({
        client: keychainProcessClient,
        headers,
        path: {
          knodeApiKeychainId: req.params.knodeApiKeychainId,
          userId: req.params.userId,
        },
      });

      await pollKnodeApiKeychain(
        response,
        headers,
        req.params.knodeApiKeychainId,
      );

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a Member from a Knode API Keychain",
      operationId: "removeKnodeApiKeychainMember",
      params: API_KnodeApiKeychainMemberPathParams,
      response: {
        204: z.undefined().meta({
          description: "Knode API Keychain Member removed successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/members/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { knodeApiKeychainId, userId } = req.params;

      logger.info(
        { requestParams: req.params, userId },
        `Checking current user membership for Knode API Keychain with ID ${knodeApiKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const isMember = await resourceExists(() =>
        keychainProcessApi.getKnodeApiKeychainMember({
          client: keychainProcessClient,
          headers,
          path: { knodeApiKeychainId, userId },
        }),
      );

      res.send({ isMember });
    },
    method: "GET",
    schema: {
      description:
        "Check whether the given User is a Member of a Knode API Keychain",
      operationId: "getKnodeApiKeychainMembership",
      params: API_KnodeApiKeychainMemberPathParams,
      response: {
        200: API_KnodeApiKeychainMembershipCheckResult.meta({
          description:
            "Knode API Keychain membership check retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/membership/:userId",
  });
};
