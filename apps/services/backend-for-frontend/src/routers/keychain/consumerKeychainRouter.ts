/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  API_CreatedResource,
  API_FileDownload,
} from "@knodia/common-models/api";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import {
  type ConsumerKeychainId,
  KnodeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
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
  type API_CreatedMemberResource,
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
import { API_PurposeState } from "@knodia/purpose-models/api";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";
import { type AxiosResponse } from "axios";
import { z } from "zod";

import { apiTags } from "../../models/apiTags.ts";
import { multiKnodeListingNotSupported } from "../../models/errors.ts";
import {
  API_ConsumerKeychainKeyPathParams,
  API_ConsumerKeychainMemberPathParams,
  API_ConsumerKeychainOptions,
  API_ConsumerKeychainPurposeLinkCheckResult,
  API_ConsumerKeychainPurposes,
  API_ConsumerKeychainsQueryParams,
  API_CreatedKeyResource,
  API_GetConsumerKeychainMembersQueryParams,
  API_GetConsumerKeychainOptionsQueryParams,
  API_GetConsumerKeychainPurposesQueryParams,
  API_GetKeychainKeysQueryParams,
  type API_Keychain,
  API_KeychainDetails,
  API_KeychainKeys,
  API_KeychainKeySeed,
  API_KeychainMembers,
  API_KeychainMemberSeed,
  API_KeychainMembershipCheckResult,
  API_KeychainPatch,
  API_Keychains,
  API_KeychainSeed,
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
import { resourceExists } from "../../utils/resourceExists.ts";

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
    consumerKeychainId: ConsumerKeychainId,
    headers: KnodiaServiceHeaders,
  ) =>
    await keychainProcessApi.getConsumerKeychain({
      client: keychainProcessClient,
      headers,
      path: { consumerKeychainId },
    });

  const pollConsumerKeychain = (
    response:
      | AxiosResponse<API_CreatedMemberResource | API_CreatedResource>
      | AxiosResponse<void>,
    headers: KnodiaServiceHeaders,
    consumerKeychainId: ConsumerKeychainId,
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
      querystring: API_GetKeychainKeysQueryParams,
      response: {
        200: API_KeychainKeys.meta({
          description: "Consumer Keychain Keys retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "List Consumer Keychain Keys",
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
        `public_key_${keyId}.pem`,
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Download a Consumer Keychain Key",
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

      await pollConsumerKeychain(
        response,
        headers,
        unsafeBrandId<ConsumerKeychainId>(response.data.id),
      );

      res.status(201).send({ id: response.data.id });
    },
    method: "POST",
    schema: {
      body: API_KeychainSeed,
      description: "Create a new Consumer Keychain",
      operationId: "createConsumerKeychain",
      response: {
        201: API_CreatedResource.meta({
          description: "Consumer Keychain created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Create a Consumer Keychain",
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

      await pollConsumerKeychain(
        response,
        headers,
        req.params.consumerKeychainId,
      );

      res.status(204).send();
    },
    method: "PATCH",
    schema: {
      body: API_KeychainPatch,
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Update a Consumer Keychain",
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

      await pollConsumerKeychain(
        response,
        headers,
        req.params.consumerKeychainId,
      );

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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Add a Member to a Consumer Keychain",
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Upload a Consumer Keychain Key",
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Remove a Consumer Keychain Key",
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

      await pollConsumerKeychain(
        response,
        headers,
        req.params.consumerKeychainId,
      );

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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Remove a Member from a Consumer Keychain",
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Delete a Consumer Keychain",
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get a Consumer Keychain",
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "List Consumer Keychain Members",
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
        200: API_KeychainMembershipCheckResult.meta({
          description:
            "Consumer Keychain membership check retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Check a Member of a Consumer Keychain",
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "List Consumer Keychain options",
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/options",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: ownerId } = getUISessionAuthData(authData);
      const { eserviceId, knodeId, limit, offset, purposeId } = req.query;
      const headers = getKnodiaServiceHeaders(req, correlationId);

      logger.info(
        { ownerId, requestQuery: req.query },
        `Getting Consumer Keychains with query parameters for owner ${ownerId}`,
      );

      async function enhanceKeychainWithCounts(
        keychain: keychainProcessApi.Keychain,
      ): Promise<API_Keychain> {
        const [{ data: keys }, { data: members }, { data: purposes }] =
          await Promise.all([
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
            keychainProcessApi.getConsumerKeychainPurposes({
              client: keychainProcessClient,
              headers,
              path: { consumerKeychainId: keychain.id },
              query: { limit: 1, offset: 0 },
            }),
          ]);

        return toAPI_Keychain(keychain, {
          keysCount: keys.pagination.total,
          membersCount: members.pagination.total,
          purposesCount: purposes.pagination.total,
        });
      }

      if (eserviceId !== undefined) {
        // TODO(KN-473): paginate to fetch all purposes if >50 exist,
        // otherwise the linked Consumer Keychains list will be undercounted
        const { data: purposes } = await remoteResourcesManagerApi.getPurposes({
          client: remoteResourcesManagerClient,
          headers,
          query: {
            eserviceId,
            knodeId,
            limit: 50,
            offset: 0,
            state: [
              API_PurposeState.enum.Active,
              API_PurposeState.enum.Suspended,
            ],
          },
        });

        // TODO(KN-473): paginate to fetch all keychains if a purpose has >50,
        // otherwise the linked Consumer Keychains list will be undercounted
        const keychainResponses = await Promise.all(
          purposes.results.map((p) =>
            keychainProcessApi.getConsumerKeychains({
              client: keychainProcessClient,
              headers,
              query: {
                knodeId: p.knodeId,
                limit: 50,
                offset: 0,
                ownerId,
                purposeId: p.id,
              },
            }),
          ),
        );

        const dedupedKeychains = new Map<string, keychainProcessApi.Keychain>();
        for (const { data } of keychainResponses) {
          for (const keychain of data.results) {
            dedupedKeychains.set(keychain.id, keychain);
          }
        }

        const sortedKeychains = Array.from(dedupedKeychains.values()).sort(
          (a, b) =>
            b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
        );

        const pageSlice = sortedKeychains.slice(offset, offset + limit);

        res.send({
          // TODO(KN-473): `total` is capped at the fan-out limit and may
          // under-count when an e-service has more linked purposes/keychains
          // than the upstream calls fetch.
          pagination: { limit, offset, total: sortedKeychains.length },
          results: await Promise.all(pageSlice.map(enhanceKeychainWithCounts)),
        });
        return;
      }

      const { data } = await keychainProcessApi.getConsumerKeychains({
        client: keychainProcessClient,
        headers,
        query: { knodeId, limit, offset, ownerId, purposeId },
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "List Consumer Keychains",
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

      // The linked purposes can in principle span more than one knode (no
      // single-knode guard exists on the keychain-process path); fail fast like
      // the RRM listings instead of silently resolving everything to one knode.
      const targetKnodeIds = [
        ...new Set(linkedPurposes.map((linked) => linked.purpose.knodeId)),
      ].map((knodeId) => KnodeId.parse(knodeId));
      if (targetKnodeIds.length > 1) {
        throw multiKnodeListingNotSupported(targetKnodeIds);
      }
      const [targetKnodeId] = targetKnodeIds;
      if (!targetKnodeId) {
        res.send({ pagination, results: [] });
        return;
      }

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
        items: linkedPurposes,
        knodeId: targetKnodeId,
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
        items: Array.from(purposesMap.values()),
        knodeId: targetKnodeId,
      });

      function enrichLinkedPurpose(
        linkedPurpose: keychainProcessApi.ConsumerKeychainPurpose,
      ) {
        const purpose = assertEntityExists(
          purposesMap.get(unsafeBrandExternalId(linkedPurpose.purpose.id)),
          `Purpose with ID ${linkedPurpose.purpose.id} not found`,
        );

        const eservice = assertEntityExists(
          eservicesMap.get(unsafeBrandExternalId(purpose.eserviceId)),
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
        501: API_Problem.meta({
          description: "Multi-knode listing not supported",
        }),
      },
      summary: "List Purposes linked to a Consumer Keychain",
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Check a Purpose link to a Consumer Keychain",
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Link a Purpose to a Consumer Keychain",
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Unlink a Purpose from a Consumer Keychain",
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/purposes/:purposeId",
  });
};
