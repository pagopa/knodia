/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  API_CreatedResource,
  API_FileDownload,
} from "@knodia/common-models/api";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { type ConsumerKeychainId, KnodeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { sendFileDownload } from "@knodia/fastify-zod-api-commons/http";
import {
  API_Problem,
  getKnodiaServiceHeaders,
  type KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  assertEntityExists,
  getExternalEntitiesMap,
} from "@knodia/fastify-zod-api-commons/utils";
import {
  API_ConsumerKeychainIdPathParam,
  API_ConsumerKeychainPurposeLinkSeed,
  API_UnlinkConsumerKeychainIdPathParams,
  API_UnlinkConsumerKeychainPurposeQueryParams,
} from "@knodia/keychain-models/api";
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
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";
import { type AxiosResponse, isAxiosError } from "axios";
import { z } from "zod";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_ConsumerKeychainKeyPathParams,
  API_ConsumerKeychainMemberPathParams,
  API_ConsumerKeychainMembershipCheckResult,
  API_ConsumerKeychainOptions,
  API_ConsumerKeychainPatch,
  API_ConsumerKeychainPurposeLinkCheckResult,
  API_ConsumerKeychainPurposes,
  API_ConsumerKeychainSeed,
  API_ConsumerKeychainsQueryParams,
  API_CreatedKeyResource,
  API_GetConsumerKeychainKeysQueryParams,
  API_GetConsumerKeychainMembersQueryParams,
  API_GetConsumerKeychainOptionsQueryParams,
  API_GetConsumerKeychainPurposesQueryParams,
  type API_Keychain,
  API_KeychainDetails,
  API_KeychainKeys,
  API_KeychainKeySeed,
  API_KeychainMembers,
  API_KeychainMemberSeed,
  API_Keychains,
} from "../../models/keychain/api.ts";
import {
  toAPI_ConsumerKeychainPurpose,
  toAPI_Keychain,
  toAPI_KeychainDetails,
  toAPI_KeychainKey,
  toAPI_KeychainOption,
  toAPI_User,
} from "../../models/keychain/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

interface ConsumerKeychainRouterOptions {
  keychainProcessClient: KeychainProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  pollingService: PollingService;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const consumerKeychainRouter: FastifyPluginAsyncZod<
  ConsumerKeychainRouterOptions
> = async (
  fastify,
  {
    keychainProcessClient,
    organizationProcessClient,
    pollingService,
    remoteResourcesManagerClient,
  },
) => {
  const retrieveConsumerKeychainById = async (
    consumerKeychainId: string,
    headers: KnodiaServiceHeaders,
  ) =>
    await keychainProcessApi.getConsumerKeychain({
      client: keychainProcessClient,
      headers,
      path: { consumerKeychainId },
    });

  const pollConsumerKeychain = (
    response: AxiosResponse<API_CreatedResource> | AxiosResponse<void>,
    headers: KnodiaServiceHeaders,
    consumerKeychainId: string,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrieveConsumerKeychainById(consumerKeychainId, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });

  const pollConsumerKeychainById = (
    consumerKeychainId: ConsumerKeychainId,
    response: AxiosResponse<unknown>,
    headers: KnodiaServiceHeaders,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrieveConsumerKeychainById(consumerKeychainId, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });

  const pollConsumerKeychainUntilDeletion = (
    consumerKeychainId: ConsumerKeychainId,
    headers: KnodiaServiceHeaders,
  ) =>
    pollingService.pollResourceUntilDeletion(() =>
      retrieveConsumerKeychainById(consumerKeychainId, headers),
    )();

  /**
   * Checks if a resource exists by calling the provided function.
   * @returns true if the resource exists, false if not found (404), throws for other errors
   */
  const resourceExists = async (
    check: () => Promise<unknown>,
  ): Promise<boolean> => {
    try {
      await check();
      return true;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  };

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { limit, offset } = req.query;

      logger.info(
        { requestParams: req.params, requestQuery: req.query },
        `Getting Consumer Keychain keys with ID ${req.params.consumerKeychainId}`,
      );

      const [{ data: keys }, { data: operator }] = await Promise.all([
        keychainProcessApi.getConsumerKeychainKeys({
          client: keychainProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { consumerKeychainId: req.params.consumerKeychainId },
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
      description: "Retrieve keys of a Consumer Keychain",
      operationId: "getConsumerKeychainKeys",
      params: API_ConsumerKeychainIdPathParam,
      querystring: API_GetConsumerKeychainKeysQueryParams,
      response: {
        200: API_KeychainKeys.meta({
          description: "Consumer Keychain Keys retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/keys",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { consumerKeychainId, keyId } = req.params;

      logger.info(
        { requestParams: req.params },
        `Downloading key ${keyId} from Consumer Keychain with ID ${consumerKeychainId}`,
      );

      const { data: key } = await keychainProcessApi.getConsumerKeychainKey({
        client: keychainProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { consumerKeychainId, keyId },
      });

      const content = Buffer.from(key.encodedPem, "base64");

      sendFileDownload(
        res,
        content,
        `public_key_${keyId}.pub`,
        "text/plain; charset=utf-8",
      );
    },
    method: "GET",
    schema: {
      description: "Download a Consumer Keychain Key",
      operationId: "downloadConsumerKeychainKey",
      params: API_ConsumerKeychainKeyPathParams,
      response: {
        200: API_FileDownload.meta({
          description: "Consumer Keychain Key downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Consumer Keychain Key not found",
        }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/keys/:keyId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Creating new Consumer Keychain with body data",
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.createConsumerKeychain({
        body: req.body,
        client: keychainProcessClient,
        headers,
      });

      await pollConsumerKeychain(response, headers, response.data.id);

      res.status(201).send({ id: response.data.id });
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
        { requestBody: req.body, requestParams: req.params },
        `Updating Consumer Keychain with ID ${req.params.consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.updateConsumerKeychain({
        body: req.body,
        client: keychainProcessClient,
        headers,
        path: { consumerKeychainId: req.params.consumerKeychainId },
      });

      await pollConsumerKeychain(response, headers, response.data.id);

      res.status(204).send();
    },
    method: "PATCH",
    schema: {
      body: API_ConsumerKeychainPatch,
      consumes: ["application/merge-patch+json"],
      description: "Update a Consumer Keychain",
      operationId: "updateConsumerKeychain",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Consumer Keychain updated successfully",
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

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body, requestParams: req.params },
        `Adding member to Consumer Keychain with ID ${req.params.consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.addConsumerKeychainMember({
        body: req.body,
        client: keychainProcessClient,
        headers,
        path: { consumerKeychainId: req.params.consumerKeychainId },
      });

      await pollConsumerKeychain(response, headers, response.data.id);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      body: API_KeychainMemberSeed,
      description: "Add a member to a Consumer Keychain",
      operationId: "addConsumerKeychainMember",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Consumer Keychain Member added successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/members",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { consumerKeychainId } = req.params;

      logger.info(
        { requestBody: req.body, requestParams: req.params },
        `Uploading key to Consumer Keychain with ID ${consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.uploadConsumerKeychainKey({
        body: req.body,
        client: keychainProcessClient,
        headers,
        path: { consumerKeychainId },
      });

      await pollConsumerKeychainById(consumerKeychainId, response, headers);

      res.status(201).send({ kid: response.data.kid });
    },
    method: "POST",
    schema: {
      body: API_KeychainKeySeed,
      description: "Upload a key to a Consumer Keychain",
      operationId: "uploadConsumerKeychainKey",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        201: API_CreatedKeyResource.meta({
          description: "Consumer Keychain Key uploaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/keys",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { consumerKeychainId, keyId } = req.params;

      logger.info(
        { requestParams: req.params },
        `Removing key ${keyId} from Consumer Keychain with ID ${consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.removeConsumerKeychainKey({
        client: keychainProcessClient,
        headers,
        path: { consumerKeychainId, keyId },
      });

      await pollConsumerKeychainById(consumerKeychainId, response, headers);

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a key from a Consumer Keychain",
      operationId: "removeConsumerKeychainKey",
      params: API_ConsumerKeychainKeyPathParams,
      response: {
        204: z.undefined().meta({
          description: "Consumer Keychain Key removed successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/keys/:keyId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Removing member ${req.params.userId} from Consumer Keychain with ID ${req.params.consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.removeConsumerKeychainMember({
        client: keychainProcessClient,
        headers,
        path: {
          consumerKeychainId: req.params.consumerKeychainId,
          userId: req.params.userId,
        },
      });

      await pollConsumerKeychain(response, headers, response.data.id);

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a Member from a Consumer Keychain",
      operationId: "removeConsumerKeychainMember",
      params: API_ConsumerKeychainMemberPathParams,
      response: {
        204: z.undefined().meta({
          description: "Consumer Keychain Member removed successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/members/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Deleting Consumer Keychain with ID ${req.params.consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      await keychainProcessApi.deleteConsumerKeychain({
        client: keychainProcessClient,
        headers,
        path: { consumerKeychainId: req.params.consumerKeychainId },
      });

      await pollConsumerKeychainUntilDeletion(
        req.params.consumerKeychainId,
        headers,
      );

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

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Getting Consumer Keychain details with ID ${req.params.consumerKeychainId}`,
      );

      const { data: consumerKeychain } =
        await keychainProcessApi.getConsumerKeychain({
          client: keychainProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { consumerKeychainId: req.params.consumerKeychainId },
        });

      res.send(toAPI_KeychainDetails(consumerKeychain));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Consumer Keychain with all its details",
      operationId: "getConsumerKeychainDetails",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        200: API_KeychainDetails.meta({
          description: "Consumer Keychain details retrieved successfully",
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

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { limit, offset } = req.query;

      logger.info(
        { requestParams: req.params, requestQuery: req.query },
        `Getting Consumer Keychain members with ID ${req.params.consumerKeychainId}`,
      );

      const { data: members } =
        await keychainProcessApi.getConsumerKeychainMembers({
          client: keychainProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { consumerKeychainId: req.params.consumerKeychainId },
          query: { limit, offset },
        });

      res.send({
        pagination: members.pagination,
        results: members.results.map(toAPI_User),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve members of a Consumer Keychain",
      operationId: "getConsumerKeychainMembers",
      params: API_ConsumerKeychainIdPathParam,
      querystring: API_GetConsumerKeychainMembersQueryParams,
      response: {
        200: API_KeychainMembers.meta({
          description: "Consumer Keychain Members retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/members",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      const { consumerKeychainId, userId } = req.params;

      logger.info(
        { requestParams: req.params, userId },
        `Checking current user membership for Consumer Keychain with ID ${consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const isMember = await resourceExists(() =>
        keychainProcessApi.getConsumerKeychainMember({
          client: keychainProcessClient,
          headers,
          path: { consumerKeychainId, userId },
        }),
      );

      res.send({ isMember });
    },
    method: "GET",
    schema: {
      description:
        "Check whether the given User is a Member of a Consumer Keychain",
      operationId: "getConsumerKeychainMembership",
      params: API_ConsumerKeychainMemberPathParams,
      response: {
        200: API_ConsumerKeychainMembershipCheckResult.meta({
          description:
            "Consumer Keychain membership check retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/membership/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: ownerId } = getUISessionAuthData(authData);

      logger.info(
        { ownerId, requestQuery: req.query },
        `Getting Consumer Keychain options with query parameters for owner ${ownerId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data } = await keychainProcessApi.getConsumerKeychains({
        client: keychainProcessClient,
        headers,
        query: {
          limit: req.query.limit,
          name: req.query.q,
          offset: req.query.offset,
          ownerId,
        },
      });

      res.send({
        pagination: data.pagination,
        results: data.results.map(toAPI_KeychainOption),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve Consumer Keychain options for combobox selection",
      operationId: "getConsumerKeychainOptions",
      querystring: API_GetConsumerKeychainOptionsQueryParams,
      response: {
        200: API_ConsumerKeychainOptions.meta({
          description: "Consumer Keychain options retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/options",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: ownerId } = getUISessionAuthData(authData);

      logger.info(
        { ownerId, requestQuery: req.query },
        `Getting Consumer Keychains with query parameters for owner ${ownerId}`,
      );

      const { limit, offset, purpose } = req.query;
      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data } = await keychainProcessApi.getConsumerKeychains({
        client: keychainProcessClient,
        headers,
        query: { limit, offset, ownerId, purpose },
      });

      async function enhanceKeychainWithCounts(
        keychain: keychainProcessApi.Keychain,
      ): Promise<API_Keychain> {
        const [{ data: keys }, { data: members }] = await Promise.all([
          keychainProcessApi.getConsumerKeychainKeys({
            client: keychainProcessClient,
            headers,
            path: { consumerKeychainId: keychain.id },
            query: { limit: 1, offset: 0 },
          }),
          keychainProcessApi.getConsumerKeychainMembers({
            client: keychainProcessClient,
            headers,
            path: { consumerKeychainId: keychain.id },
            query: { limit: 1, offset: 0 },
          }),
        ]);

        return toAPI_Keychain(keychain, {
          keysCount: keys.pagination.total,
          membersCount: members.pagination.total,
        });
      }

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
        "Retrieve a paginated list of Consumer Keychains owned by the current user organization",
      operationId: "getConsumerKeychains",
      querystring: API_ConsumerKeychainsQueryParams,
      response: {
        200: API_Keychains.meta({
          description: "Consumer Keychains retrieved successfully",
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
      const { consumerKeychainId } = req.params;
      const { limit, offset } = req.query;

      logger.info(
        { requestParams: req.params, requestQuery: req.query },
        `Getting Purposes linked to Consumer Keychain with ID ${consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const {
        data: { pagination, results: linkedPurposes },
      } = await keychainProcessApi.getConsumerKeychainPurposes({
        client: keychainProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { consumerKeychainId },
        query: { limit, offset },
      });

      const purposesMap = await getExternalEntitiesMap({
        fetchFn: ({ entityIds, knodeId }) =>
          Promise.all(
            entityIds.map((purposeId) =>
              remoteResourcesManagerApi
                .getPurpose({
                  client: remoteResourcesManagerClient,
                  headers,
                  path: { purposeId },
                  query: { knodeId },
                })
                .then((res) => res.data),
            ),
          ),
        getEntityId: ({ purpose }) => purpose.id,
        getKnodeId: ({ purpose }) => KnodeId.parse(purpose.knodeId),
        items: linkedPurposes,
      });

      const eservicesMap = await getExternalEntitiesMap({
        fetchFn: ({ entityIds, knodeId }) =>
          Promise.all(
            entityIds.map((eserviceId) =>
              remoteResourcesManagerApi
                .getEserviceDetails({
                  client: remoteResourcesManagerClient,
                  headers,
                  path: { eserviceId },
                  query: { knodeId },
                })
                .then((res) => res.data),
            ),
          ),
        getEntityId: (purpose) => purpose.eserviceId,
        getKnodeId: (purpose) => KnodeId.parse(purpose.knodeId),
        items: Array.from(purposesMap.values()).flatMap((p) =>
          Array.from(p.values()),
        ),
      });

      function enrichLinkedPurpose(
        linkedPurpose: keychainProcessApi.ConsumerKeychainPurpose,
      ) {
        const purpose = assertEntityExists(
          purposesMap
            .get(linkedPurpose.purpose.knodeId)
            ?.get(unsafeBrandExternalId(linkedPurpose.purpose.id)),
          `Purpose with ID ${linkedPurpose.purpose.id} not found`,
        );

        const eservice = assertEntityExists(
          eservicesMap
            .get(purpose.knodeId)
            ?.get(unsafeBrandExternalId(purpose.eserviceId)),
          `Eservice with ID ${purpose.eserviceId} not found`,
        );

        return toAPI_ConsumerKeychainPurpose(eservice, purpose);
      }

      res.send({
        pagination,
        results: linkedPurposes.map(enrichLinkedPurpose),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve Purposes linked to a Consumer Keychain",
      operationId: "getConsumerKeychainPurposes",
      params: API_ConsumerKeychainIdPathParam,
      querystring: API_GetConsumerKeychainPurposesQueryParams,
      response: {
        200: API_ConsumerKeychainPurposes.meta({
          description:
            "Purposes linked to the Consumer Keychain retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { consumerKeychainId, purposeId } = req.params;
      const { knodeId } = req.query;

      logger.info(
        { request: { params: req.params, query: req.query } },
        `Checking whether Purpose ${purposeId} owned by Knode ${knodeId} is linked to Consumer Keychain ${consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const isLinked = await resourceExists(() =>
        keychainProcessApi.getConsumerKeychainPurpose({
          client: keychainProcessClient,
          headers,
          path: { consumerKeychainId, purposeId },
          query: { knodeId },
        }),
      );

      res.send({ isLinked });
    },
    method: "GET",
    schema: {
      description:
        "Check whether the given Purpose is linked to a Consumer Keychain",
      operationId: "getConsumerKeychainPurposeLink",
      params: API_UnlinkConsumerKeychainIdPathParams,
      querystring: API_UnlinkConsumerKeychainPurposeQueryParams,
      response: {
        200: API_ConsumerKeychainPurposeLinkCheckResult.meta({
          description:
            "Consumer Keychain purpose link check retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/purposes/:purposeId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { knodeId, purposeId } = req.body;

      logger.info(
        `Linking Purpose ${purposeId} owned by Knode ${knodeId} to Consumer Keychain ${req.params.consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.linkPurposeToConsumerKeychain({
        body: req.body,
        client: keychainProcessClient,
        headers,
        path: { consumerKeychainId: req.params.consumerKeychainId },
      });

      await pollConsumerKeychain(
        response,
        headers,
        req.params.consumerKeychainId,
      );

      res.status(204).send();
    },
    method: "POST",
    schema: {
      body: API_ConsumerKeychainPurposeLinkSeed,
      description: "Link a Purpose to a Consumer Keychain",
      operationId: "linkPurposeToConsumerKeychain",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Purpose successfully linked to Consumer Keychain",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { consumerKeychainId, purposeId } = req.params;
      logger.info(
        {
          request: {
            params: req.params,
            query: req.query,
          },
        },
        `Unlinking Purpose ${purposeId} owned by Knode ${req.query.knodeId} from Consumer Keychain ${consumerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response =
        await keychainProcessApi.unlinkPurposeFromConsumerKeychain({
          client: keychainProcessClient,
          headers,
          path: {
            consumerKeychainId,
            purposeId,
          },
          query: { knodeId: req.query.knodeId },
        });

      await pollConsumerKeychain(response, headers, consumerKeychainId);

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Unlink a Purpose from a Consumer Keychain",
      operationId: "unlinkPurposeFromConsumerKeychain",
      params: API_UnlinkConsumerKeychainIdPathParams,
      querystring: API_UnlinkConsumerKeychainPurposeQueryParams,
      response: {
        204: z.undefined().meta({
          description: "Purpose successfully unlinked from Consumer Keychain",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/purposes/:purposeId",
  });
};
