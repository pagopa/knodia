/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementIdPathParam } from "@knodia/agreement-models/api";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";
import z from "zod";

import {
  API_AgreementSeed,
  API_ConsumerAgreements,
  API_GetPendingConsumerAgreementsQueryParams,
  API_PendingConsumerAgreements,
  API_SuspendReactivateConsumerAgreementQueryParams,
} from "../../models/agreement/api.ts";
import { toAPI_PendingConsumerAgreement } from "../../models/agreement/apiConverter.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

interface AgreementConsumerRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const agreementConsumerRouter: FastifyPluginAsyncZod<
  AgreementConsumerRouterOptions
> = async (fastify, { remoteResourcesManagerClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);

      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { requestBody: req.body },
        `Creating agreement for consumer ${consumerId} on knode ${req.body.knodeId}`,
      );

      const { data } = await remoteResourcesManagerApi.createAgreement({
        body: {
          eserviceId: req.body.eserviceId,
          eserviceVersionId: req.body.eserviceVersionId,
          knodeId: req.body.knodeId,
        },
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
      });

      res.status(201).send({ id: data.id });
    },
    method: "POST",
    schema: {
      body: API_AgreementSeed,
      description:
        "Create a new Agreement for the consumer to access a Producer's E-service",
      operationId: "createConsumerAgreement",
      response: {
        201: API_CreatedResource.meta({
          description: "Agreement created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Create a consumer Agreement",
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(`Getting Consumer Agreements for Consumer ID ${consumerId}`);

      const [
        { data: activeAgreements },
        { data: suspendedAgreements },
        { data: archivedAgreements },
      ] = await Promise.all([
        remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            limit: 1,
            offset: 0,
            state: "Active",
          },
        }),
        remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            limit: 1,
            offset: 0,
            state: "Suspended",
          },
        }),
        remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            limit: 1,
            offset: 0,
            state: "Archived",
          },
        }),
      ]);

      res.status(200).send({
        counters: {
          activeAgreements: activeAgreements.pagination.total,
          archivedAgreements: archivedAgreements.pagination.total,
          suspendedAgreements: suspendedAgreements.pagination.total,
        },
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Consumer Agreements",
      operationId: "getConsumerAgreements",
      response: {
        200: API_ConsumerAgreements.meta({
          description: "Consumer Agreements retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { requestQuery: req.query },
        `Getting pending Consumer Agreements for Consumer ID ${consumerId}`,
      );

      const { data } = await remoteResourcesManagerApi.getEservices({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: {
          agreementState: "PendingConsumerOperatorIdentification",
          limit: req.query.limit,
          offset: req.query.offset,
        },
      });

      res.status(200).send({
        pagination: data.pagination,
        results: data.results.map(toAPI_PendingConsumerAgreement),
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a paginated list of Consumer Agreements pending action",
      operationId: "getPendingConsumerAgreements",
      querystring: API_GetPendingConsumerAgreementsQueryParams,
      response: {
        200: API_PendingConsumerAgreements.meta({
          description: "Pending Consumer Agreements retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements/pending",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      getUISessionAuthData(authData);

      logger.info(
        `Reactivating Consumer Agreement ${req.params.agreementId} on knode ${req.query.knodeId}`,
      );

      await remoteResourcesManagerApi.reactivateAgreement({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { agreementId: req.params.agreementId },
        query: { knodeId: req.query.knodeId },
      });

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Reactivate an Agreement as Consumer",
      operationId: "reactivateConsumerAgreement",
      params: API_AgreementIdPathParam,
      querystring: API_SuspendReactivateConsumerAgreementQueryParams,
      response: {
        204: z.undefined().meta({
          description: "Agreement reactivated successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements/:agreementId/reactivate",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      getUISessionAuthData(authData);

      logger.info(
        `Suspending Consumer Agreement ${req.params.agreementId} on knode ${req.query.knodeId}`,
      );

      await remoteResourcesManagerApi.suspendAgreement({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { agreementId: req.params.agreementId },
        query: { knodeId: req.query.knodeId },
      });

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Suspend an Agreement as Consumer",
      operationId: "suspendConsumerAgreement",
      params: API_AgreementIdPathParam,
      querystring: API_SuspendReactivateConsumerAgreementQueryParams,
      response: {
        204: z.undefined().meta({
          description: "Agreement suspended successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements/:agreementId/suspend",
  });
};
