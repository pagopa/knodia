/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { toExternalResource } from "@knodia/common-models/externalResource";
import {
  type PurposeId,
  unsafeBrandId,
  unsafeBrandKeyId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
  KnodiaServiceHeaders,
  MetadataVersionHeader,
  setMetadataVersionHeader,
} from "@knodia/fastify-zod-api-commons/models";
import {
  API_ConsumerKeychainIdPathParam,
  API_ConsumerKeychainPurposeLinkSeed,
  API_UnlinkConsumerKeychainIdPathParams,
  API_UnlinkConsumerKeychainPurposeQueryParams,
} from "@knodia/keychain-models/api";
import { z } from "zod";

import type { ConsumerKeychainService } from "../services/consumerKeychainService.ts";

import {
  API_ConsumerKeychainKeyPathParams,
  API_ConsumerKeychainMemberPathParams,
  API_ConsumerKeychainPurpose,
  API_ConsumerKeychainPurposes,
  API_GetConsumerKeychainKeysQueryParams,
  API_GetConsumerKeychainMembersQueryParams,
  API_GetConsumerKeychainPurposePathParams,
  API_GetConsumerKeychainPurposeQueryParams,
  API_GetConsumerKeychainPurposesQueryParams,
  API_GetConsumerKeychainsQueryParams,
  API_Keychain,
  API_KeychainKey,
  API_KeychainKeys,
  API_KeychainKeySeed,
  API_KeychainMembers,
  API_KeychainMemberSeed,
  API_KeychainPatch,
  API_Keychains,
  API_KeychainSeed,
  API_User,
} from "../models/api.ts";
import {
  toAPI_ConsumerKeychainPurpose,
  toAPI_Keychain,
  toAPI_KeychainKey,
  toAPI_User,
} from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface ConsumerKeychainRouterOptions {
  consumerKeychainService: ConsumerKeychainService;
}

export const consumerKeychainRouter: FastifyPluginAsyncZod<
  ConsumerKeychainRouterOptions
> = async (fastify, { consumerKeychainService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await consumerKeychainService.getConsumerKeychains(req.query, ctx);

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
      description: "Retrieve a list of Consumer Keychains",
      headers: KnodiaServiceHeaders,
      operationId: "getConsumerKeychains",
      querystring: API_GetConsumerKeychainsQueryParams,
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

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const {
        data: consumerKeychain,
        metadata: { version },
      } = await consumerKeychainService.getConsumerKeychain(
        req.params.consumerKeychainId,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Keychain(consumerKeychain));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Consumer Keychain by its ID",
      headers: KnodiaServiceHeaders,
      operationId: "getConsumerKeychain",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Consumer Keychain retrieved successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const keys = await consumerKeychainService.getConsumerKeychainKeys(
        req.params.consumerKeychainId,
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
      description: "Retrieve keys of a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getConsumerKeychainKeys",
      params: API_ConsumerKeychainIdPathParam,
      querystring: API_GetConsumerKeychainKeysQueryParams,
      response: {
        200: API_KeychainKeys.meta({
          description: "Consumer Keychain keys retrieved successfully",
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const key = await consumerKeychainService.getConsumerKeychainKey(
        req.params.consumerKeychainId,
        unsafeBrandKeyId(req.params.keyId),
        ctx,
      );

      res.status(200).send(toAPI_KeychainKey(key));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Consumer Keychain Key by kid",
      headers: KnodiaServiceHeaders,
      operationId: "getConsumerKeychainKey",
      params: API_ConsumerKeychainKeyPathParams,
      response: {
        200: API_KeychainKey.meta({
          description: "Consumer Keychain Key retrieved successfully",
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const member = await consumerKeychainService.getConsumerKeychainMember(
        req.params.consumerKeychainId,
        unsafeBrandUserId(req.params.userId),
        ctx,
      );

      res.status(200).send(toAPI_User(member));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Consumer Keychain Member by user ID",
      headers: KnodiaServiceHeaders,
      operationId: "getConsumerKeychainMember",
      params: API_ConsumerKeychainMemberPathParams,
      response: {
        200: API_User.meta({
          description: "Consumer Keychain Member retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Consumer Keychain Member not found",
        }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/members/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: consumerKeychain,
        metadata: { version },
      } = await consumerKeychainService.createConsumerKeychain(req.body, ctx);

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_Keychain(consumerKeychain));
    },
    method: "POST",
    schema: {
      body: API_KeychainSeed,
      description: "Create a new Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "createConsumerKeychain",
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Consumer Keychain created successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: consumerKeychain,
        metadata: { version },
      } = await consumerKeychainService.updateConsumerKeychain(
        req.params.consumerKeychainId,
        req.body,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Keychain(consumerKeychain));
    },
    method: "PATCH",
    schema: {
      body: API_KeychainPatch,
      consumes: ["application/merge-patch+json"],
      description: "Update a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "updateConsumerKeychain",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Consumer Keychain updated successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      await consumerKeychainService.deleteConsumerKeychain(
        req.params.consumerKeychainId,
        ctx,
      );

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Delete a Consumer Keychain",
      headers: KnodiaServiceHeaders,
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: consumerKeychain,
        metadata: { version },
      } = await consumerKeychainService.addConsumerKeychainMember(
        req.params.consumerKeychainId,
        req.body,
        ctx,
      );
      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Keychain(consumerKeychain));
    },
    method: "POST",
    schema: {
      body: API_KeychainMemberSeed,
      description: "Add a member to a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "addConsumerKeychainMember",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Consumer Keychain member added successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical"] },
      ]);

      const {
        data: key,
        metadata: { version },
      } = await consumerKeychainService.uploadConsumerKeychainKey(
        req.params.consumerKeychainId,
        req.body,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_KeychainKey(key));
    },
    method: "POST",
    schema: {
      body: API_KeychainKeySeed,
      description: "Upload a key to a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "uploadConsumerKeychainKey",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_KeychainKey.meta({
            description: "Consumer Keychain Key uploaded successfully",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const {
        metadata: { version },
      } = await consumerKeychainService.removeConsumerKeychainKey(
        req.params.consumerKeychainId,
        unsafeBrandKeyId(req.params.keyId),
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a key from a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "removeConsumerKeychainKey",
      params: API_ConsumerKeychainKeyPathParams,
      response: {
        204: {
          headers: MetadataVersionHeader,
          properties: z.undefined().meta({
            description: "Consumer Keychain Key removed successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/keys/:keyId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await consumerKeychainService.getConsumerKeychainMembers(
          req.params.consumerKeychainId,
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
      description: "Retrieve members of a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getConsumerKeychainMembers",
      params: API_ConsumerKeychainIdPathParam,
      querystring: API_GetConsumerKeychainMembersQueryParams,
      response: {
        200: API_KeychainMembers.meta({
          description: "Consumer Keychain members retrieved successfully",
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: consumerKeychain,
        metadata: { version },
      } = await consumerKeychainService.removeConsumerKeychainMember(
        unsafeBrandId(req.params.consumerKeychainId),
        unsafeBrandUserId(req.params.userId),
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Keychain(consumerKeychain));
    },
    method: "DELETE",
    schema: {
      description: "Remove a member from a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "removeConsumerKeychainMember",
      params: API_ConsumerKeychainMemberPathParams,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Keychain.meta({
            description: "Consumer Keychain member removed successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Consumer Keychain or Member not found",
        }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/members/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        metadata: { version },
      } = await consumerKeychainService.linkPurposeToConsumerKeychain(
        {
          consumerKeychainPurpose: {
            consumerKeychainId: req.params.consumerKeychainId,
            purpose: toExternalResource<PurposeId>(
              req.body.purposeId,
              req.body.knodeId,
            ),
          },
          headers: getKnodiaServiceHeaders(req, ctx.correlationId),
        },
        ctx,
      );

      setMetadataVersionHeader(res, version);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      body: API_ConsumerKeychainPurposeLinkSeed,
      description: "Link a Purpose to a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "linkPurposeToConsumerKeychain",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        204: {
          headers: MetadataVersionHeader,
          properties: z.undefined().meta({
            description: "Purpose successfully linked to Consumer Keychain",
          }),
        },
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await consumerKeychainService.getConsumerKeychainPurposes(
          req.params.consumerKeychainId,
          req.query,
          ctx,
        );

      res.status(200).send({
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
        results: results.map(toAPI_ConsumerKeychainPurpose),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Purposes linked to a Consumer Keychain",
      headers: KnodiaServiceHeaders,
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
        404: API_Problem.meta({ description: "Consumer Keychain Not Found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { data: purpose } =
        await consumerKeychainService.getConsumerKeychainPurpose(
          req.params.consumerKeychainId,
          {
            id: req.params.purposeId,
            knodeId: req.query.knodeId,
          },
          ctx,
        );

      res.status(200).send(toAPI_ConsumerKeychainPurpose(purpose));
    },
    method: "GET",
    schema: {
      description: "Retrieve a specific Purpose linked to a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getConsumerKeychainPurpose",
      params: API_GetConsumerKeychainPurposePathParams,
      querystring: API_GetConsumerKeychainPurposeQueryParams,
      response: {
        200: API_ConsumerKeychainPurpose.meta({
          description:
            "Purpose linked to the Consumer Keychain retrieved successfully",
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

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        metadata: { version },
      } = await consumerKeychainService.unlinkPurposeFromConsumerKeychain(
        {
          consumerKeychainId: req.params.consumerKeychainId,
          purpose: {
            id: req.params.purposeId,
            knodeId: req.query.knodeId,
          },
        },
        ctx,
      );

      setMetadataVersionHeader(res, version);

      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Unlink a Purpose from a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "unlinkPurposeFromConsumerKeychain",
      params: API_UnlinkConsumerKeychainIdPathParams,
      querystring: API_UnlinkConsumerKeychainPurposeQueryParams,
      response: {
        204: {
          headers: MetadataVersionHeader,
          properties: z.undefined().meta({
            description: "Purpose successfully unlinked from Consumer Keychain",
          }),
        },
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
