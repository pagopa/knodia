/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { AgreementActor } from "@knodia/agreement-models";
import { API_AgreementIdPathParam } from "@knodia/agreement-models/api";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId, unsafeBrandId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
  MetadataVersionHeader,
  setMetadataVersionHeader,
} from "@knodia/fastify-zod-api-commons/models";

import type { AgreementService } from "../services/agreementService.ts";

import {
  API_Agreement,
  API_Agreements,
  API_AgreementSeed,
  API_GetAgreementsQueryParams,
} from "../models/api.ts";
import { toAPI_Agreement } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface AgreementRouterOptions {
  agreementService: AgreementService;
}

export const agreementRouter: FastifyPluginAsyncZod<
  AgreementRouterOptions
> = async (fastify, { agreementService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      const {
        data: agreement,
        metadata: { version },
      } = await agreementService.createAgreement(
        {
          consumer: {
            id: unsafeBrandExternalId(req.body.consumer.id),
            knodeId: KnodeId.parse(req.body.consumer.knodeId),
          },
          consumerAttributes: req.body.consumer.attributes,
          eserviceId: unsafeBrandId(req.body.eserviceId),
          eserviceVersionId: unsafeBrandId(req.body.eserviceVersionId),
        },
        ctx,
      );

      setMetadataVersionHeader(res, version);

      res.status(201).send(toAPI_Agreement(agreement));
    },
    method: "POST",
    schema: {
      body: API_AgreementSeed,
      description: "Create a new Agreement",
      headers: KnodiaServiceHeaders,
      operationId: "createAgreement",
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_Agreement.meta({
            description: "Agreement created successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
        { tokenType: "internal" },
      ]);

      const { results, totalCount } = await agreementService.getAgreements(
        req.query,
        ctx,
      );

      res.status(200).send({
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
        results: results.map(toAPI_Agreement),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Agreements",
      headers: KnodiaServiceHeaders,
      operationId: "getAgreements",
      querystring: API_GetAgreementsQueryParams,
      response: {
        200: API_Agreements.meta({
          description: "Agreements retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
        { tokenType: "internal" },
      ]);

      const {
        data: agreement,
        metadata: { version },
      } = await agreementService.getAgreement(req.params.agreementId, ctx);

      setMetadataVersionHeader(res, version);

      res.status(200).send(toAPI_Agreement(agreement));
    },
    method: "GET",
    schema: {
      description: "Retrieve an Agreement by its ID",
      headers: KnodiaServiceHeaders,
      operationId: "getAgreement",
      params: API_AgreementIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Agreement.meta({
            description: "Agreement retrieved successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements/:agreementId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      const {
        data: agreement,
        metadata: { version },
      } = await agreementService.suspendAgreement(req.params.agreementId, {
        actor: AgreementActor.enum.Consumer,
        ctx,
      });

      setMetadataVersionHeader(res, version);

      res.status(200).send(toAPI_Agreement(agreement));
    },
    method: "POST",
    schema: {
      description: "Suspend an Agreement by Consumer",
      headers: KnodiaServiceHeaders,
      operationId: "suspendAgreementByConsumer",
      params: API_AgreementIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Agreement.meta({
            description: "Agreement suspended successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements/:agreementId/suspendByConsumer",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: agreement,
        metadata: { version },
      } = await agreementService.suspendAgreement(req.params.agreementId, {
        actor: AgreementActor.enum.Producer,
        ctx,
      });

      setMetadataVersionHeader(res, version);

      res.status(200).send(toAPI_Agreement(agreement));
    },
    method: "POST",
    schema: {
      description: "Suspend an Agreement by Producer",
      headers: KnodiaServiceHeaders,
      operationId: "suspendAgreementByProducer",
      params: API_AgreementIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Agreement.meta({
            description: "Agreement suspended successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements/:agreementId/suspendByProducer",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      const {
        data: agreement,
        metadata: { version },
      } = await agreementService.reactivateAgreement(req.params.agreementId, {
        actor: AgreementActor.enum.Consumer,
        ctx,
      });

      setMetadataVersionHeader(res, version);

      res.status(200).send(toAPI_Agreement(agreement));
    },
    method: "POST",
    schema: {
      description: "Reactivate an Agreement by Consumer",
      headers: KnodiaServiceHeaders,
      operationId: "reactivateAgreementByConsumer",
      params: API_AgreementIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Agreement.meta({
            description: "Agreement reactivated successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements/:agreementId/reactivateByConsumer",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: agreement,
        metadata: { version },
      } = await agreementService.reactivateAgreement(req.params.agreementId, {
        actor: AgreementActor.enum.Producer,
        ctx,
      });

      setMetadataVersionHeader(res, version);

      res.status(200).send(toAPI_Agreement(agreement));
    },
    method: "POST",
    schema: {
      description: "Reactivate an Agreement by Producer",
      headers: KnodiaServiceHeaders,
      operationId: "reactivateAgreementByProducer",
      params: API_AgreementIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Agreement.meta({
            description: "Agreement reactivated successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements/:agreementId/reactivateByProducer",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      const {
        data: agreement,
        metadata: { version },
      } = await agreementService.archiveAgreement(req.params.agreementId, ctx);

      setMetadataVersionHeader(res, version);

      res.status(200).send(toAPI_Agreement(agreement));
    },
    method: "POST",
    schema: {
      description: "Archive a suspended Agreement by Consumer",
      headers: KnodiaServiceHeaders,
      operationId: "archiveAgreement",
      params: API_AgreementIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Agreement.meta({
            description: "Agreement archived successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements/:agreementId/archive",
  });
};
