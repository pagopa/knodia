import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import {
  type KnodeApiKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
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
  isPolledVersionAtLeastResponseVersion,
  type PollingService,
} from "@knodia/polling";
import { type AxiosResponse } from "axios";
import { z } from "zod";

import { apiTags } from "../../models/apiTags.ts";
import {
  type API_Keychain,
  API_KeychainDetails,
  API_Keychains,
  API_KnodeApiKeychainPatch,
  API_KnodeApiKeychainSeed,
  API_KnodeApiKeychainsQueryParams,
} from "../../models/keychain/api.ts";
import {
  toAPI_Keychain,
  toAPI_KeychainDetails,
} from "../../models/keychain/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

interface KnodeApiKeychainRouterOptions {
  keychainProcessClient: KeychainProcessClient;
  pollingService: PollingService;
}

export const knodeApiKeychainRouter: FastifyPluginAsyncZod<
  KnodeApiKeychainRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (fastify, { keychainProcessClient, pollingService }) => {
  const retrieveKnodeApiKeychainById = async (
    knodeApiKeychainId: KnodeApiKeychainId,
    headers: KnodiaServiceHeaders,
  ) =>
    await keychainProcessApi.getKnodeApiKeychain({
      client: keychainProcessClient,
      headers,
      path: { knodeApiKeychainId },
    });

  const pollKnodeApiKeychain = (
    response: AxiosResponse<keychainProcessApi.Keychain>,
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
};
