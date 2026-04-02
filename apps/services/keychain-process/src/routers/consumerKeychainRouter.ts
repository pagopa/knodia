/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { unsafeBrandId, unsafeBrandUserId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
  MetadataVersionHeader,
  setMetadataVersionHeader,
} from "@knodia/fastify-zod-api-commons/models";
import { API_ConsumerKeychainIdPathParam } from "@knodia/keychain-models/api";
import { z } from "zod";

import type { ConsumerKeychainService } from "../services/consumerKeychainService.ts";

import {
  API_ConsumerKeychainMemberPathParam,
  API_ConsumerKeychainPatch,
  API_ConsumerKeychainPurpose,
  API_ConsumerKeychainPurposeLinkSeed,
  API_ConsumerKeychainSeed,
  API_GetConsumerKeychainsQueryParams,
  API_Keychain,
  API_KeychainMemberSeed,
  API_Keychains,
} from "../models/api.ts";
import {
  toAPI_ConsumerKeychainPurpose,
  toAPI_Keychain,
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
      body: API_ConsumerKeychainSeed,
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
      body: API_ConsumerKeychainPatch,
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
      params: API_ConsumerKeychainMemberPathParam,
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
        404: API_Problem.meta({ description: "Consumer Keychain not found" }),
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

      const { data: consumerKeychainPurpose } =
        await consumerKeychainService.linkPurposeToConsumerKeychain(
          {
            consumerKeychainId: req.params.consumerKeychainId,
            knodeId: req.body.knodeId,
            purposeId: unsafeBrandExternalId(req.body.purposeId),
            req,
          },
          ctx,
        );

      res
        .status(200)
        .send(toAPI_ConsumerKeychainPurpose(consumerKeychainPurpose));
    },
    method: "POST",
    schema: {
      body: API_ConsumerKeychainPurposeLinkSeed,
      description: "Link a Purpose to a Consumer Keychain",
      headers: KnodiaServiceHeaders,
      operationId: "linkPurposeToConsumerKeychain",
      params: API_ConsumerKeychainIdPathParam,
      response: {
        200: API_ConsumerKeychainPurpose.meta({
          description: "Purpose successfully linked to Consumer Keychain",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.consumerKeychain],
    },
    url: "/consumerKeychains/:consumerKeychainId/purposes",
  });
};
