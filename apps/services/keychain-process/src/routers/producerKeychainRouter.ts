/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  type EserviceId,
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
import {
  API_CreatedMemberResource,
  API_ProducerKeychainEserviceLinkSeed,
  API_ProducerKeychainIdPathParam,
} from "@knodia/keychain-models/api";
import z from "zod";

import type { ProducerKeychainService } from "../services/producerKeychainService.ts";

import {
  API_GetProducerKeychainEservicesQueryParams,
  API_GetProducerKeychainKeysQueryParams,
  API_GetProducerKeychainMembersQueryParams,
  API_GetProducerKeychainsQueryParams,
  API_Keychain,
  API_KeychainKey,
  API_KeychainKeys,
  API_KeychainKeySeed,
  API_KeychainMembers,
  API_KeychainMemberSeed,
  API_KeychainPatch,
  API_Keychains,
  API_KeychainSeed,
  API_ProducerKeychainEservice,
  API_ProducerKeychainEservicePathParams,
  API_ProducerKeychainEservices,
  API_ProducerKeychainKeyPathParams,
  API_ProducerKeychainMemberPathParams,
  API_User,
} from "../models/api.ts";
import {
  toAPI_CreatedMemberResource,
  toAPI_Keychain,
  toAPI_KeychainKey,
  toAPI_ProducerKeychainEservice,
  toAPI_User,
} from "../models/apiConverter.ts";
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

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: addedUserId,
        metadata: { version },
      } = await producerKeychainService.addProducerKeychainMember(
        req.params.producerKeychainId,
        req.body,
        ctx,
      );
      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_CreatedMemberResource(addedUserId));
    },
    method: "POST",
    schema: {
      body: API_KeychainMemberSeed,
      description: "Add a member to a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "addProducerKeychainMember",
      params: API_ProducerKeychainIdPathParam,
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_CreatedMemberResource.meta({
            description: "Producer Keychain member added successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Producer Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/members",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        metadata: { version },
      } = await producerKeychainService.removeProducerKeychainMember(
        unsafeBrandId(req.params.producerKeychainId),
        unsafeBrandUserId(req.params.userId),
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a member from a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "removeProducerKeychainMember",
      params: API_ProducerKeychainMemberPathParams,
      response: {
        204: {
          headers: MetadataVersionHeader,
          properties: z.undefined().meta({
            description: "Producer Keychain member removed successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Producer Keychain or Member not found",
        }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/members/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await producerKeychainService.getProducerKeychainMembers(
          req.params.producerKeychainId,
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
      description: "Retrieve members of a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getProducerKeychainMembers",
      params: API_ProducerKeychainIdPathParam,
      querystring: API_GetProducerKeychainMembersQueryParams,
      response: {
        200: API_KeychainMembers.meta({
          description: "Producer Keychain members retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Producer Keychain not found" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/members",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const member = await producerKeychainService.getProducerKeychainMember(
        req.params.producerKeychainId,
        unsafeBrandUserId(req.params.userId),
        ctx,
      );

      res.status(200).send(toAPI_User(member));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Producer Keychain Member by user ID",
      headers: KnodiaServiceHeaders,
      operationId: "getProducerKeychainMember",
      params: API_ProducerKeychainMemberPathParams,
      response: {
        200: API_User.meta({
          description: "Producer Keychain Member retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Producer Keychain Member not found",
        }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/members/:userId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical"] },
      ]);

      const {
        data: key,
        metadata: { version },
      } = await producerKeychainService.uploadProducerKeychainKey(
        req.params.producerKeychainId,
        req.body,
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_KeychainKey(key));
    },
    method: "POST",
    schema: {
      body: API_KeychainKeySeed,
      description: "Upload a key to a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "uploadProducerKeychainKey",
      params: API_ProducerKeychainIdPathParam,
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_KeychainKey.meta({
            description: "Producer Keychain Key uploaded successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Producer Keychain not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/keys",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const {
        metadata: { version },
      } = await producerKeychainService.removeProducerKeychainKey(
        req.params.producerKeychainId,
        unsafeBrandKeyId(req.params.keyId),
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Remove a key from a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "removeProducerKeychainKey",
      params: API_ProducerKeychainKeyPathParams,
      response: {
        204: {
          headers: MetadataVersionHeader,
          properties: z.undefined().meta({
            description: "Producer Keychain Key removed successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Producer Keychain not found" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/keys/:keyId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const keys = await producerKeychainService.getProducerKeychainKeys(
        req.params.producerKeychainId,
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
      description: "Retrieve keys of a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getProducerKeychainKeys",
      params: API_ProducerKeychainIdPathParam,
      querystring: API_GetProducerKeychainKeysQueryParams,
      response: {
        200: API_KeychainKeys.meta({
          description: "Producer Keychain keys retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Producer Keychain not found" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/keys",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical", "administrative"] },
      ]);

      const key = await producerKeychainService.getProducerKeychainKey(
        req.params.producerKeychainId,
        unsafeBrandKeyId(req.params.keyId),
        ctx,
      );

      res.status(200).send(toAPI_KeychainKey(key));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Producer Keychain Key by kid",
      headers: KnodiaServiceHeaders,
      operationId: "getProducerKeychainKey",
      params: API_ProducerKeychainKeyPathParams,
      response: {
        200: API_KeychainKey.meta({
          description: "Producer Keychain Key retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Producer Keychain Key not found",
        }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/keys/:keyId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        metadata: { version },
      } = await producerKeychainService.linkEserviceToProducerKeychain(
        {
          eserviceId: unsafeBrandId<EserviceId>(req.body.eserviceId),
          producerKeychainId: req.params.producerKeychainId,
        },
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(204).send();
    },
    method: "POST",
    schema: {
      body: API_ProducerKeychainEserviceLinkSeed,
      description: "Link an E-service to a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "linkEserviceToProducerKeychain",
      params: API_ProducerKeychainIdPathParam,
      response: {
        204: {
          headers: MetadataVersionHeader,
          properties: z.undefined().meta({
            description: "E-service successfully linked to Producer Keychain",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Producer Keychain or E-service not found",
        }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        metadata: { version },
      } = await producerKeychainService.unlinkEserviceFromProducerKeychain(
        {
          eserviceId: unsafeBrandId<EserviceId>(req.params.eserviceId),
          producerKeychainId: req.params.producerKeychainId,
        },
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(204).send();
    },
    method: "DELETE",
    schema: {
      description: "Unlink an E-service from a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "unlinkEserviceFromProducerKeychain",
      params: API_ProducerKeychainEservicePathParams,
      response: {
        204: {
          headers: MetadataVersionHeader,
          properties: z.undefined().meta({
            description:
              "E-service successfully unlinked from Producer Keychain",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({
          description: "Producer Keychain or E-service link not found",
        }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/eservices/:eserviceId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await producerKeychainService.getProducerKeychainEservices(
          req.params.producerKeychainId,
          req.query,
          ctx,
        );

      res.status(200).send({
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
        results: results.map(toAPI_ProducerKeychainEservice),
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a list of E-services linked to a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getProducerKeychainEservices",
      params: API_ProducerKeychainIdPathParam,
      querystring: API_GetProducerKeychainEservicesQueryParams,
      response: {
        200: API_ProducerKeychainEservices.meta({
          description:
            "E-services linked to the Producer Keychain retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Producer Keychain Not Found" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { data: eservice } =
        await producerKeychainService.getProducerKeychainEservice(
          req.params.producerKeychainId,
          unsafeBrandId(req.params.eserviceId),
          ctx,
        );

      res.status(200).send(toAPI_ProducerKeychainEservice(eservice));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a specific E-service linked to a Producer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "getProducerKeychainEservice",
      params: API_ProducerKeychainEservicePathParams,
      response: {
        200: API_ProducerKeychainEservice.meta({
          description:
            "E-service linked to the Producer Keychain retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.producerKeychain],
    },
    url: "/producerKeychains/:producerKeychainId/eservices/:eserviceId",
  });
};
