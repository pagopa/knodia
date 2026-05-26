import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import {
  type ProducerKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
  type KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import { API_ProducerKeychainIdPathParam } from "@knodia/keychain-models/api";
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
  API_KeychainDetails,
  API_KeychainPatch,
  API_Keychains,
  API_KeychainSeed,
  API_ProducerKeychainsQueryParams,
} from "../../models/keychain/api.ts";
import {
  toAPI_Keychain,
  toAPI_KeychainDetails,
} from "../../models/keychain/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

interface ProducerKeychainRouterOptions {
  keychainProcessClient: KeychainProcessClient;
  pollingService: PollingService;
}

export const producerKeychainRouter: FastifyPluginAsyncZod<
  ProducerKeychainRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (fastify, { keychainProcessClient, pollingService }) => {
  const retrieveProducerKeychainById = async (
    producerKeychainId: ProducerKeychainId,
    headers: KnodiaServiceHeaders,
  ) =>
    await keychainProcessApi.getProducerKeychain({
      client: keychainProcessClient,
      headers,
      path: { producerKeychainId },
    });

  const pollProducerKeychain = (
    response: AxiosResponse<API_CreatedResource> | AxiosResponse<void>,
    headers: KnodiaServiceHeaders,
    producerKeychainId: ProducerKeychainId,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrieveProducerKeychainById(producerKeychainId, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });

  const pollProducerKeychainUntilDeletion = (
    producerKeychainId: ProducerKeychainId,
    headers: KnodiaServiceHeaders,
  ) =>
    pollingService.pollResourceUntilDeletion(() =>
      retrieveProducerKeychainById(producerKeychainId, headers),
    )();

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Creating new Producer Keychain with body data",
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.createProducerKeychain({
        body: req.body,
        client: keychainProcessClient,
        headers,
      });

      await pollProducerKeychain(
        response,
        headers,
        unsafeBrandId<ProducerKeychainId>(response.data.id),
      );

      res.status(201).send({ id: response.data.id });
    },
    method: "POST",
    schema: {
      body: API_KeychainSeed,
      description: "Create a new Producer Keychain",
      operationId: "createProducerKeychain",
      response: {
        201: API_CreatedResource.meta({
          description: "Producer Keychain created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: ownerId } = getUISessionAuthData(authData);
      const { limit, offset } = req.query;

      logger.info(
        { ownerId, requestQuery: req.query },
        `Getting Producer Keychains with query parameters for owner ${ownerId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data } = await keychainProcessApi.getProducerKeychains({
        client: keychainProcessClient,
        headers,
        query: { limit, offset, ownerId },
      });

      res.send({
        pagination: data.pagination,
        // TODO(KN-673): populate counters once Producer Keychain
        // keys/members listing endpoints are available (see KN-642).
        results: data.results.map((keychain) =>
          toAPI_Keychain(keychain, { keysCount: 0, membersCount: 0 }),
        ),
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a paginated list of Producer Keychains owned by the current user organization",
      operationId: "getProducerKeychains",
      querystring: API_ProducerKeychainsQueryParams,
      response: {
        200: API_Keychains.meta({
          description: "Producer Keychains retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Getting Producer Keychain details with ID ${req.params.producerKeychainId}`,
      );

      const { data: producerKeychain } =
        await keychainProcessApi.getProducerKeychain({
          client: keychainProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { producerKeychainId: req.params.producerKeychainId },
        });

      res.send(toAPI_KeychainDetails(producerKeychain));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Producer Keychain with all its details",
      operationId: "getProducerKeychainDetails",
      params: API_ProducerKeychainIdPathParam,
      response: {
        200: API_KeychainDetails.meta({
          description: "Producer Keychain details retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Producer Keychain not found" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body, requestParams: req.params },
        `Updating Producer Keychain with ID ${req.params.producerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await keychainProcessApi.updateProducerKeychain({
        body: req.body,
        client: keychainProcessClient,
        headers,
        path: { producerKeychainId: req.params.producerKeychainId },
      });

      await pollProducerKeychain(
        response,
        headers,
        req.params.producerKeychainId,
      );

      res.status(204).send();
    },
    method: "PATCH",
    schema: {
      body: API_KeychainPatch,
      consumes: ["application/merge-patch+json"],
      description: "Update a Producer Keychain",
      operationId: "updateProducerKeychain",
      params: API_ProducerKeychainIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Producer Keychain updated successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Producer Keychain not found" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Deleting Producer Keychain with ID ${req.params.producerKeychainId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      await keychainProcessApi.deleteProducerKeychain({
        client: keychainProcessClient,
        headers,
        path: { producerKeychainId: req.params.producerKeychainId },
      });

      await pollProducerKeychainUntilDeletion(
        req.params.producerKeychainId,
        headers,
      );

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Delete a Producer Keychain",
      operationId: "deleteProducerKeychain",
      params: API_ProducerKeychainIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Producer Keychain deleted successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Producer Keychain not found" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId",
  });
};
