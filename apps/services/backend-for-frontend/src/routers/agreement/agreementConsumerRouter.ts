/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  API_AgreementIdPathParam,
  API_AgreementState,
  API_MagicLink,
} from "@knodia/agreement-models/api";
import { API_CreatedResource } from "@knodia/common-models/api";
import { KnodeId } from "@knodia/common-models/ids";
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

import type { BffProcessConfig } from "../../config/config.ts";

import {
  API_AgreementSeed,
  API_ConsumerAgreementCounters,
  API_ConsumerAgreements,
  API_CreateAgreementConsumerActivationMagicLinkQueryParams,
  API_GetConsumerAgreementsQueryParams,
  API_GetPendingConsumerAgreementsQueryParams,
  API_PendingConsumerAgreements,
  API_SuspendReactivateConsumerAgreementQueryParams,
} from "../../models/agreement/api.ts";
import {
  toAPI_ConsumerAgreement,
  toAPI_PendingConsumerAgreement,
} from "../../models/agreement/apiConverter.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

interface AgreementConsumerRouterOptions {
  config: BffProcessConfig;
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
> = async (fastify, { config, remoteResourcesManagerClient }) => {
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

      logger.info(
        `Getting Consumer Agreement counters for Consumer ID ${consumerId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const countAgreementsByState = async (
        agreementState: API_AgreementState,
      ) => {
        const { data } = await remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers,
          query: { limit: 1, offset: 0, state: [agreementState] },
        });
        return data.pagination.total;
      };

      const [activeAgreements, suspendedAgreements, archivedAgreements] =
        await Promise.all([
          countAgreementsByState(API_AgreementState.enum.Active),
          countAgreementsByState(API_AgreementState.enum.Suspended),
          countAgreementsByState(API_AgreementState.enum.Archived),
        ]);

      res.status(200).send({
        counters: {
          activeAgreements,
          archivedAgreements,
          suspendedAgreements,
        },
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve Consumer Agreement counters per state",
      operationId: "getConsumerAgreementCounters",
      response: {
        200: API_ConsumerAgreementCounters.meta({
          description: "Consumer Agreement counters retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements/counters",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: consumerId } = getUISessionAuthData(authData);
      const { limit, offset, state } = req.query;
      const headers = getKnodiaServiceHeaders(req, correlationId);

      logger.info(
        { requestQuery: req.query },
        `Listing Consumer Agreements for Consumer ID ${consumerId}`,
      );

      const { data } = await remoteResourcesManagerApi.getAgreements({
        client: remoteResourcesManagerClient,
        headers,
        query: {
          limit,
          offset,
          state: state?.length ? state : consumerVisibleStates,
        },
      });

      const enrichedAgreements = await Promise.all(
        data.results.map(async (agreement) => {
          const { data: eservice } =
            await remoteResourcesManagerApi.getEserviceDetails({
              client: remoteResourcesManagerClient,
              headers,
              path: { eserviceId: agreement.eserviceId },
              query: { knodeId: KnodeId.parse(agreement.knodeId) },
            });
          return { agreement, eservice };
        }),
      );

      res.status(200).send({
        pagination: data.pagination,
        results: enrichedAgreements.map(toAPI_ConsumerAgreement),
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a paginated list of Consumer Agreements, optionally filtered by state",
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
      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { requestQuery: req.query },
        `Getting pending Consumer Agreements for Consumer ID ${consumerId}`,
      );

      const { data } = await remoteResourcesManagerApi.getEservices({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: {
          agreementStates: [
            API_AgreementState.enum.PendingConsumerOperatorIdentification,
          ],
          limit: req.query.limit,
          offset: req.query.offset,
        },
      });

      res.status(200).send({
        pagination: data.pagination,
        results: data.results.map((eservice) =>
          toAPI_PendingConsumerAgreement({
            eservice,
            recentUpdateDays: config.recentUpdateDays,
          }),
        ),
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
      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        `Creating activation magic link for Agreement ${req.params.agreementId} requested by Consumer ${consumerId} on Knode ${req.query.knodeId}`,
      );

      const { data } =
        await remoteResourcesManagerApi.createAgreementActivationMagicLink({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { agreementId: req.params.agreementId },
          query: { knodeId: req.query.knodeId },
        });

      res.status(200).send(data);
    },
    method: "POST",
    schema: {
      description:
        "Request a magic link for a Consumer user to activate an Agreement on the Producer Knode's frontend",
      operationId: "createAgreementConsumerActivationMagicLink",
      params: API_AgreementIdPathParam,
      querystring: API_CreateAgreementConsumerActivationMagicLinkQueryParams,
      response: {
        200: API_MagicLink.meta({
          description: "Magic link created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Agreement not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Create an Agreement activation magic link",
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements/:agreementId/activationMagicLink",
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
