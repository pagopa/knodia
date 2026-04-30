/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  unsafeBrandId,
  unsafeBrandKeyId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
  MetadataVersionHeader,
  setMetadataVersionHeader,
} from "@knodia/fastify-zod-api-commons/models";
import { API_KnodiaApiKeychainIdPathParam } from "@knodia/keychain-models/api";
import { z } from "zod";

import type { KnodiaApiKeychainService } from "../services/knodiaApiKeychainService.ts";

import {
  API_GetKnodiaApiKeychainKeysQueryParams,
  API_GetKnodiaApiKeychainMembersQueryParams,
  API_GetKnodiaApiKeychainsQueryParams,
  API_KeychainKey,
  API_KeychainKeys,
  API_KeychainKeySeed,
  API_KeychainMembers,
  API_KeychainMemberSeed,
  API_KnodiaApiKeychain,
  API_KnodiaApiKeychainKeyPathParams,
  API_KnodiaApiKeychainMemberPathParams,
  API_KnodiaApiKeychainPatch,
  API_KnodiaApiKeychains,
  API_KnodiaApiKeychainSeed,
  API_User,
} from "../models/api.ts";
import {
  toAPI_KeychainKey,
  toAPI_KnodiaApiKeychain,
  toAPI_User,
} from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface KnodiaApiKeychainRouterOptions {
  knodiaApiKeychainService: KnodiaApiKeychainService;
}

export const knodiaApiKeychainRouter: FastifyPluginAsyncZod<
  KnodiaApiKeychainRouterOptions
> = async (fastify, { knodiaApiKeychainService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await knodiaApiKeychainService.getKnodiaApiKeychains(req.query, ctx);

      res.status(200).send({
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
        results: results.map(toAPI_KnodiaApiKeychain),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Knodia API Keychains",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodiaApiKeychains",
      querystring: API_GetKnodiaApiKeychainsQueryParams,
      response: {
        200: API_KnodiaApiKeychains.meta({
          description: "Knodia API keychains retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const {
        data: keychain,
        metadata: { version },
      } = await knodiaApiKeychainService.getKnodiaApiKeychain(
        req.params.knodiaApiKeychainId,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_KnodiaApiKeychain(keychain));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Knodia API Keychain by its ID",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodiaApiKeychain",
      params: API_KnodiaApiKeychainIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_KnodiaApiKeychain.meta({
            description: "Knodia API Keychain retrieved successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knodia API Keychain not found" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: keychain,
        metadata: { version },
      } = await knodiaApiKeychainService.createKnodiaApiKeychain(req.body, ctx);

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_KnodiaApiKeychain(keychain));
    },
    method: "POST",
    schema: {
      body: API_KnodiaApiKeychainSeed,
      description: "Create a new Knodia API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "createKnodiaApiKeychain",
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_KnodiaApiKeychain.meta({
            description: "Knodia API Keychain created successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: keychain,
        metadata: { version },
      } = await knodiaApiKeychainService.updateKnodiaApiKeychain(
        req.params.knodiaApiKeychainId,
        req.body,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_KnodiaApiKeychain(keychain));
    },
    method: "PATCH",
    schema: {
      body: API_KnodiaApiKeychainPatch,
      consumes: ["application/merge-patch+json"],
      description: "Update a Knodia API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "updateKnodiaApiKeychain",
      params: API_KnodiaApiKeychainIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_KnodiaApiKeychain.meta({
            description: "Knodia API Keychain updated successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knodia API Keychain not found" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      await knodiaApiKeychainService.deleteKnodiaApiKeychain(
        req.params.knodiaApiKeychainId,
        ctx,
      );

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Delete a Knodia API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "deleteKnodiaApiKeychain",
      params: API_KnodiaApiKeychainIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Knodia API Keychain deleted successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knodia API Keychain not found" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await knodiaApiKeychainService.getKnodiaApiKeychainMembers(
          req.params.knodiaApiKeychainId,
          req.query,
          ctx,
        );

      res.status(200).send({
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
        results: results.map(toAPI_User),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve members of a Knodia API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodiaApiKeychainMembers",
      params: API_KnodiaApiKeychainIdPathParam,
      querystring: API_GetKnodiaApiKeychainMembersQueryParams,
      response: {
        200: API_KeychainMembers.meta({
          description: "Knodia API Keychain members retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knodia API Keychain not found" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId/members",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const member = await knodiaApiKeychainService.getKnodiaApiKeychainMember(
        req.params.knodiaApiKeychainId,
        unsafeBrandUserId(req.params.userId),
        ctx,
      );

      res.status(200).send(toAPI_User(member));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Knodia API Keychain Member by user ID",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodiaApiKeychainMember",
      params: API_KnodiaApiKeychainMemberPathParams,
      response: {
        200: API_User.meta({
          description: "Knodia API Keychain Member retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Knodia API Keychain Member not found",
        }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId/members/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: keychain,
        metadata: { version },
      } = await knodiaApiKeychainService.addKnodiaApiKeychainMember(
        req.params.knodiaApiKeychainId,
        req.body,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_KnodiaApiKeychain(keychain));
    },
    method: "POST",
    schema: {
      body: API_KeychainMemberSeed,
      description: "Add a member to a Knodia API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "addKnodiaApiKeychainMember",
      params: API_KnodiaApiKeychainIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_KnodiaApiKeychain.meta({
            description: "Knodia API Keychain member added successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knodia API Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId/members",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: keychain,
        metadata: { version },
      } = await knodiaApiKeychainService.removeKnodiaApiKeychainMember(
        unsafeBrandId(req.params.knodiaApiKeychainId),
        unsafeBrandUserId(req.params.userId),
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_KnodiaApiKeychain(keychain));
    },
    method: "DELETE",
    schema: {
      description: "Remove a member from a Knodia API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "removeKnodiaApiKeychainMember",
      params: API_KnodiaApiKeychainMemberPathParams,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_KnodiaApiKeychain.meta({
            description: "Knodia API Keychain member removed successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knodia API Keychain not found" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId/members/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const keys = await knodiaApiKeychainService.getKnodiaApiKeychainKeys(
        req.params.knodiaApiKeychainId,
        req.query,
        ctx,
      );

      res.status(200).send({
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: keys.totalCount,
        },
        results: keys.results.map(toAPI_KeychainKey),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve keys of a Knodia API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodiaApiKeychainKeys",
      params: API_KnodiaApiKeychainIdPathParam,
      querystring: API_GetKnodiaApiKeychainKeysQueryParams,
      response: {
        200: API_KeychainKeys.meta({
          description: "Knodia API Keychain keys retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knodia API Keychain not found" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId/keys",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const key = await knodiaApiKeychainService.getKnodiaApiKeychainKey(
        req.params.knodiaApiKeychainId,
        unsafeBrandKeyId(req.params.keyId),
        ctx,
      );

      res.status(200).send(toAPI_KeychainKey(key));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Knodia API Keychain Key by kid",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodiaApiKeychainKey",
      params: API_KnodiaApiKeychainKeyPathParams,
      response: {
        200: API_KeychainKey.meta({
          description: "Knodia API Keychain Key retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Knodia API Keychain Key not found",
        }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId/keys/:keyId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical"] },
      ]);

      const {
        data: key,
        metadata: { version },
      } = await knodiaApiKeychainService.uploadKnodiaApiKeychainKey(
        req.params.knodiaApiKeychainId,
        req.body,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_KeychainKey(key));
    },
    method: "POST",
    schema: {
      body: API_KeychainKeySeed,
      description: "Upload a key to a Knodia API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "uploadKnodiaApiKeychainKey",
      params: API_KnodiaApiKeychainIdPathParam,
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_KeychainKey.meta({
            description: "Knodia API Keychain Key uploaded successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knodia API Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId/keys",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const {
        metadata: { version },
      } = await knodiaApiKeychainService.removeKnodiaApiKeychainKey(
        req.params.knodiaApiKeychainId,
        unsafeBrandKeyId(req.params.keyId),
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a key from a Knodia API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "removeKnodiaApiKeychainKey",
      params: API_KnodiaApiKeychainKeyPathParams,
      response: {
        204: {
          headers: MetadataVersionHeader,
          properties: z.undefined().meta({
            description: "Knodia API Keychain Key removed successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knodia API Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.knodiaApiKeychain],
    },
    url: "/knodiaApiKeychains/:knodiaApiKeychainId/keys/:keyId",
  });
};
