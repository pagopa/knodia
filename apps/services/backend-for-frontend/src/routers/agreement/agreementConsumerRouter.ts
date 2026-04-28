/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  API_AgreementIdPathParam,
  API_AgreementState,
} from "@knodia/agreement-models/api";
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
  API_GetConsumerAgreementsQueryParams,
  API_SuspendReactivateConsumerAgreementQueryParams,
} from "../../models/agreement/api.ts";
import { toAPI_ConsumerAgreement } from "../../models/agreement/apiConverter.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

interface AgreementConsumerRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

// PendingConsumerOperatorIdentification is excluded: counters cover only
// visible states and the default list must agree with the counters.
const consumerVisibleStates = [
  API_AgreementState.enum.Active,
  API_AgreementState.enum.Suspended,
  API_AgreementState.enum.Archived,
];

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
      const { limit, offset, state } = req.query;

      logger.info(
        { requestQuery: req.query },
        `Getting Consumer Agreements for Consumer ID ${consumerId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);
      const callRRM = (
        query: remoteResourcesManagerApi.GetAgreementsData["query"],
      ) =>
        remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers,
          query,
        });

      const [
        { data: activeAgreements },
        { data: suspendedAgreements },
        { data: archivedAgreements },
        { data: filteredAgreements },
      ] = await Promise.all([
        callRRM({
          limit: 1,
          offset: 0,
          state: [API_AgreementState.enum.Active],
        }),
        callRRM({
          limit: 1,
          offset: 0,
          state: [API_AgreementState.enum.Suspended],
        }),
        callRRM({
          limit: 1,
          offset: 0,
          state: [API_AgreementState.enum.Archived],
        }),
        callRRM({
          limit,
          offset,
          state: state?.length ? state : consumerVisibleStates,
        }),
      ]);

      res.status(200).send({
        counters: {
          activeAgreements: activeAgreements.pagination.total,
          archivedAgreements: archivedAgreements.pagination.total,
          suspendedAgreements: suspendedAgreements.pagination.total,
        },
        pagination: filteredAgreements.pagination,
        results: filteredAgreements.results.map(toAPI_ConsumerAgreement),
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve Consumer Agreement counters and a paginated list, optionally filtered by state",
      operationId: "getConsumerAgreements",
      querystring: API_GetConsumerAgreementsQueryParams,
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

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      getUISessionAuthData(authData);

      logger.info(
        `Archiving Consumer Agreement ${req.params.agreementId} on knode ${req.query.knodeId}`,
      );

      await remoteResourcesManagerApi.archiveAgreement({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { agreementId: req.params.agreementId },
        query: { knodeId: req.query.knodeId },
      });

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Archive an Agreement as Consumer",
      operationId: "archiveConsumerAgreement",
      params: API_AgreementIdPathParam,
      querystring: API_SuspendReactivateConsumerAgreementQueryParams,
      response: {
        204: z.undefined().meta({
          description: "Agreement archived successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements/:agreementId/archive",
  });
};
