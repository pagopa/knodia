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
import { API_ProducerKeychainIdPathParam } from "@knodia/keychain-models/api";
import z from "zod";

import type { ProducerKeychainService } from "../services/producerKeychainService.ts";

import {
  API_GetProducerKeychainsQueryParams,
  API_Keychain,
  API_KeychainPatch,
  API_Keychains,
  API_KeychainSeed,
} from "../models/api.ts";
import { toAPI_Keychain } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface ProducerKeychainRouterOptions {
  producerKeychainService: ProducerKeychainService;
}

export const producerKeychainRouter: FastifyPluginAsyncZod<
  ProducerKeychainRouterOptions
> = async (fastify, { producerKeychainService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: producerKeychain,
        metadata: { version },
      } = await producerKeychainService.createProducerKeychain(req.body, ctx);

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_Keychain(producerKeychain));
    },
    method: "POST",
    schema: {
      body: API_KeychainSeed,
      description: "Create a new Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "createProducerKeychain",
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Producer Keychain created successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await producerKeychainService.getProducerKeychains(req.query, ctx);

      res.status(200).send({
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
        results: results.map(toAPI_Keychain),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Producer Keychains",
      headers: KnodiaServiceHeaders,
      operationId: "getProducerKeychains",
      querystring: API_GetProducerKeychainsQueryParams,
      response: {
        200: API_Keychains.meta({
          description: "Producer keychains retrieved successfully",
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const {
        data: producerKeychain,
        metadata: { version },
      } = await producerKeychainService.getProducerKeychain(
        req.params.producerKeychainId,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Keychain(producerKeychain));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Producer Keychain by its ID",
      headers: KnodiaServiceHeaders,
      operationId: "getProducerKeychain",
      params: API_ProducerKeychainIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Producer Keychain retrieved successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: producerKeychain,
        metadata: { version },
      } = await producerKeychainService.updateProducerKeychain(
        req.params.producerKeychainId,
        req.body,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Keychain(producerKeychain));
    },
    method: "PATCH",
    schema: {
      body: API_KeychainPatch,
      consumes: ["application/merge-patch+json"],
      description: "Update a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "updateProducerKeychain",
      params: API_ProducerKeychainIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Producer Keychain updated successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      await producerKeychainService.deleteProducerKeychain(
        req.params.producerKeychainId,
        ctx,
      );

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Delete a Producer Keychain",
      headers: KnodiaServiceHeaders,
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
