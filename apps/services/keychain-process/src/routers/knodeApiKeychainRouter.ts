/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandKeyId, unsafeBrandUserId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
  MetadataVersionHeader,
  setMetadataVersionHeader,
} from "@knodia/fastify-zod-api-commons/models";
import {
  API_CreatedMemberResource,
  API_KnodeApiKeychainIdPathParam,
} from "@knodia/keychain-models/api";
import z from "zod";

import type { KnodeApiKeychainService } from "../services/knodeApiKeychainService.ts";

import {
  API_GetKnodeApiKeychainKeysQueryParams,
  API_GetKnodeApiKeychainMembersQueryParams,
  API_GetKnodeApiKeychainsQueryParams,
  API_Keychain,
  API_KeychainKey,
  API_KeychainKeys,
  API_KeychainKeySeed,
  API_KeychainMembers,
  API_KeychainMemberSeed,
  API_KeychainPatch,
  API_Keychains,
  API_KeychainSeed,
  API_KnodeApiKeychainKeyPathParams,
  API_KnodeApiKeychainMemberPathParams,
  API_User,
} from "../models/api.ts";
import {
  toAPI_CreatedMemberResource,
  toAPI_Keychain,
  toAPI_KeychainKey,
  toAPI_User,
} from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface KnodeApiKeychainRouterOptions {
  knodeApiKeychainService: KnodeApiKeychainService;
}

export const knodeApiKeychainRouter: FastifyPluginAsyncZod<
  KnodeApiKeychainRouterOptions
> = async (fastify, { knodeApiKeychainService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: knodeApiKeychain,
        metadata: { version },
      } = await knodeApiKeychainService.createKnodeApiKeychain(req.body, ctx);

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_Keychain(knodeApiKeychain));
    },
    method: "POST",
    schema: {
      body: API_KeychainSeed,
      description: "Create a new Knode API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "createKnodeApiKeychain",
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Knode API Keychain created successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const {
        data: knodeApiKeychain,
        metadata: { version },
      } = await knodeApiKeychainService.getKnodeApiKeychain(
        req.params.knodeApiKeychainId,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Keychain(knodeApiKeychain));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Knode API Keychain by its ID",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodeApiKeychain",
      params: API_KnodeApiKeychainIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Knode API Keychain retrieved successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: knodeApiKeychain,
        metadata: { version },
      } = await knodeApiKeychainService.updateKnodeApiKeychain(
        req.params.knodeApiKeychainId,
        req.body,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Keychain(knodeApiKeychain));
    },
    method: "PATCH",
    schema: {
      body: API_KeychainPatch,
      consumes: ["application/merge-patch+json"],
      description: "Update a Knode API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "updateKnodeApiKeychain",
      params: API_KnodeApiKeychainIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Knode API Keychain updated successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Knode API Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const key = await knodeApiKeychainService.getKnodeApiKeychainKey(
        req.params.knodeApiKeychainId,
        unsafeBrandKeyId(req.params.keyId),
        ctx,
      );

      res.status(200).send(toAPI_KeychainKey(key));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Knode API Keychain Key by kid",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodeApiKeychainKey",
      params: API_KnodeApiKeychainKeyPathParams,
      response: {
        200: API_KeychainKey.meta({
          description: "Knode API Keychain Key retrieved successfully",
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical"] },
      ]);

      const {
        data: key,
        metadata: { version },
      } = await knodeApiKeychainService.uploadKnodeApiKeychainKey(
        req.params.knodeApiKeychainId,
        req.body,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_KeychainKey(key));
    },
    method: "POST",
    schema: {
      body: API_KeychainKeySeed,
      description: "Upload a key to a Knode API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "uploadKnodeApiKeychainKey",
      params: API_KnodeApiKeychainIdPathParam,
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_KeychainKey.meta({
            description: "Knode API Keychain Key uploaded successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const keys = await knodeApiKeychainService.getKnodeApiKeychainKeys(
        req.params.knodeApiKeychainId,
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
      description: "Retrieve keys of a Knode API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodeApiKeychainKeys",
      params: API_KnodeApiKeychainIdPathParam,
      querystring: API_GetKnodeApiKeychainKeysQueryParams,
      response: {
        200: API_KeychainKeys.meta({
          description: "Knode API Keychain keys retrieved successfully",
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await knodeApiKeychainService.getKnodeApiKeychains(req.query, ctx);

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
      description: "Retrieve a list of Knode API Keychains",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodeApiKeychains",
      querystring: API_GetKnodeApiKeychainsQueryParams,
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: addedMemberId,
        metadata: { version },
      } = await knodeApiKeychainService.addKnodeApiKeychainMember(
        req.params.knodeApiKeychainId,
        req.body,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_CreatedMemberResource(addedMemberId));
    },
    method: "POST",
    schema: {
      body: API_KeychainMemberSeed,
      description: "Add a member to a Knode API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "addKnodeApiKeychainMember",
      params: API_KnodeApiKeychainIdPathParam,
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_CreatedMemberResource.meta({
            description: "Knode API Keychain member added successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const member = await knodeApiKeychainService.getKnodeApiKeychainMember(
        req.params.knodeApiKeychainId,
        unsafeBrandUserId(req.params.userId),
        ctx,
      );

      res.status(200).send(toAPI_User(member));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Knode API Keychain Member by user ID",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodeApiKeychainMember",
      params: API_KnodeApiKeychainMemberPathParams,
      response: {
        200: API_User.meta({
          description: "Knode API Keychain Member retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Knode API Keychain Member not found",
        }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/members/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await knodeApiKeychainService.getKnodeApiKeychainMembers(
          req.params.knodeApiKeychainId,
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
      description: "Retrieve members of a Knode API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getKnodeApiKeychainMembers",
      params: API_KnodeApiKeychainIdPathParam,
      querystring: API_GetKnodeApiKeychainMembersQueryParams,
      response: {
        200: API_KeychainMembers.meta({
          description: "Knode API Keychain members retrieved successfully",
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        metadata: { version },
      } = await knodeApiKeychainService.removeKnodeApiKeychainMember(
        req.params.knodeApiKeychainId,
        unsafeBrandUserId(req.params.userId),
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a member from a Knode API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "removeKnodeApiKeychainMember",
      params: API_KnodeApiKeychainMemberPathParams,
      response: {
        204: {
          headers: MetadataVersionHeader,
          properties: z.undefined().meta({
            description: "Knode API Keychain member removed successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Knode API Keychain or Member not found",
        }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/members/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const {
        metadata: { version },
      } = await knodeApiKeychainService.removeKnodeApiKeychainKey(
        req.params.knodeApiKeychainId,
        unsafeBrandKeyId(req.params.keyId),
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a key from a Knode API Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "removeKnodeApiKeychainKey",
      params: API_KnodeApiKeychainKeyPathParams,
      response: {
        204: {
          headers: MetadataVersionHeader,
          properties: z.undefined().meta({
            description: "Knode API Keychain Key removed successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Knode API Keychain or Key not found",
        }),
      },
      tags: [apiTags.knodeApiKeychain],
    },
    url: "/knodeApiKeychains/:knodeApiKeychainId/keys/:keyId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      await knodeApiKeychainService.deleteKnodeApiKeychain(
        req.params.knodeApiKeychainId,
        ctx,
      );

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Delete a Knode API Keychain",
      headers: KnodiaServiceHeaders,
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
