/* eslint-disable max-lines-per-function */
import type { ConsumerKeychainId } from "@knodia/common-models/ids";
import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  type KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import { API_ConsumerKeychainIdPathParam } from "@knodia/keychain-models/api";
import {
  keychainProcessApi,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";
import {
  isPolledVersionAtLeastResponseVersion,
  type PollingService,
} from "@knodia/polling";
import { z } from "zod";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_ConsumerKeychainMemberPathParam,
  API_ConsumerKeychainPatch,
  API_ConsumerKeychainSeed,
  API_ConsumerKeychainsQueryParams,
  type API_Keychain,
  API_KeychainDetails,
  API_KeychainKeySeed,
  API_KeychainMemberSeed,
  API_Keychains,
  API_Users,
} from "../../models/keychain/api.ts";
import {
  toAPI_Keychain,
  toAPI_KeychainDetails,
  toAPI_User,
} from "../../models/keychain/apiConverter.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface ConsumerKeychainRouterOptions {
  keychainProcessClient: KeychainProcessClient;
  pollingService: PollingService;
}

export const consumerKeychainRouter: FastifyPluginAsyncZod<
  ConsumerKeychainRouterOptions
> = async (fastify, { keychainProcessClient, pollingService }) => {
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
    response: AxiosResponse<API_CreatedResource>,
    headers: KnodiaServiceHeaders,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrieveConsumerKeychainById(response.data.id, headers),
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

      await pollConsumerKeychain(response, headers);

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

      await pollConsumerKeychain(response, headers);

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

      await pollConsumerKeychain(response, headers);

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
          description: "Consumer Keychain member added successfully",
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

      res.status(201).send({ id: response.data.kid });
    },
    method: "POST",
    schema: {
      body: API_KeychainKeySeed,
      description: "Upload a key to a Consumer Keychain",
      operationId: "uploadConsumerKeychainKey",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        201: API_CreatedResource.meta({
          description: "Consumer Keychain key uploaded successfully",
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

      await pollConsumerKeychain(response, headers);

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a member from a Consumer Keychain",
      operationId: "removeConsumerKeychainMember",
      params: API_ConsumerKeychainMemberPathParam,
      response: {
        204: z.undefined().meta({
          description: "Consumer Keychain member removed successfully",
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
        404: API_Problem.meta({ description: "Consumer keychain not found" }),
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
        `Getting Consumer Keychain members with ID ${req.params.consumerKeychainId}`,
      );

      const { data: users } =
        await keychainProcessApi.getConsumerKeychainMembers({
          client: keychainProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { consumerKeychainId: req.params.consumerKeychainId },
        });

      res.send(users.map(toAPI_User));
    },
    method: "GET",
    schema: {
      description: "Retrieve members of a Consumer Keychain",
      operationId: "getConsumerKeychainMembers",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        200: API_Users.meta({
          description: "Consumer Keychain members retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer keychain not found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/members",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestQuery: req.query },
        "Getting Consumer Keychains with query parameters",
      );

      const { limit, offset } = req.query;
      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data } = await keychainProcessApi.getConsumerKeychains({
        client: keychainProcessClient,
        headers,
        query: { limit, offset },
      });

      async function enhanceKeychainWithCounts(
        keychain: keychainProcessApi.Keychain,
      ): Promise<API_Keychain> {
        const { data: members } =
          await keychainProcessApi.getConsumerKeychainMembers({
            client: keychainProcessClient,
            headers,
            path: { consumerKeychainId: keychain.id },
          });

        return toAPI_Keychain(keychain, {
          keysCount: 0, // TODO: retrieve keysCount when available
          membersCount: members.length,
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
        "Retrieve a paginated list of Consumer keychains for the logged-in user's organization",
      operationId: "getConsumerKeychains",
      querystring: API_ConsumerKeychainsQueryParams,
      response: {
        200: API_Keychains.meta({
          description: "Consumer keychains retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains",
  });
};
