import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId } from "@knodia/common-models/ids";
import {
  eserviceProcessApi,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
  type KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  assertEntityExists,
  getExternalEntitiesMap,
} from "@knodia/fastify-zod-api-commons/utils";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import {
  isPolledVersionAtLeastResponseVersion,
  type PollingService,
} from "@knodia/polling";
import { API_PurposeIdPathParam } from "@knodia/purpose-models/api";
import {
  purposeProcessApi,
  type PurposeProcessClient,
} from "@knodia/purpose-process-client";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";
import z from "zod";

import type { BffProcessConfig } from "../../config/config.ts";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_GetProducerPurposesQueryParams,
  API_ProducerPurposes,
  API_PurposeDetails,
} from "../../models/purpose/api.ts";
import {
  toAPI_ProducerPurpose,
  toAPI_PurposeDetails,
} from "../../models/purpose/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { getRecentUpdateCutoffDate } from "../../utils/recentUpdate.ts";

interface PurposeProducerRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  config: BffProcessConfig;
  eserviceProcessClient: EserviceProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  pollingService: PollingService;
  purposeProcessClient: PurposeProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const purposeProducerRouter: FastifyPluginAsyncZod<
  PurposeProducerRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (
  fastify,
  {
    agreementProcessClient,
    config,
    eserviceProcessClient,
    organizationProcessClient,
    pollingService,
    purposeProcessClient,
    remoteResourcesManagerClient,
  },
) => {
  const retrievePurposeById = (
    purposeId: string,
    headers: KnodiaServiceHeaders,
  ) =>
    purposeProcessApi.getPurpose({
      client: purposeProcessClient,
      headers,
      path: { purposeId },
    });

  const pollPurpose = (
    response: AxiosResponse<purposeProcessApi.Purpose>,
    headers: KnodiaServiceHeaders,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrievePurposeById(response.data.id, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);

      const { organizationId: producerId } = getUISessionAuthData(authData);

      logger.info(
        { requestQuery: req.query },
        "Getting Producer Purposes with query parameters",
      );

      const { agreementId, eserviceId, limit, offset, recentlyUpdated, state } =
        req.query;

      const updatedSince = recentlyUpdated
        ? getRecentUpdateCutoffDate(config.recentUpdateDays).toISOString()
        : undefined;

      const { data } = await purposeProcessApi.getPurposes({
        client: purposeProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: {
          agreementId,
          eserviceId,
          limit,
          offset,
          producerId,
          state,
          updatedSince,
        },
      });

      if (data.results.length === 0) {
        res.send({ pagination: data.pagination, results: [] });
        return;
      }

      const eserviceIds = new Set(
        data.results.map((purpose) => purpose.eserviceId),
      );
      const [eservicesMap, consumersMap] = await Promise.all([
        eserviceProcessApi
          .getEservices({
            client: eserviceProcessClient,
            headers: getKnodiaServiceHeaders(req, correlationId),
            query: {
              eserviceId: Array.from(eserviceIds),
              limit: eserviceIds.size,
              offset: 0,
            },
          })
          .then(
            (res) =>
              new Map(
                res.data.results.map((eservice) => [eservice.id, eservice]),
              ),
          ),
        getExternalEntitiesMap({
          fetchFn: ({ entityIds }) =>
            remoteResourcesManagerApi
              .getOrganizations({
                client: remoteResourcesManagerClient,
                headers: getKnodiaServiceHeaders(req, correlationId),
                query: {
                  knodeId: config.knodeId,
                  limit: entityIds.length,
                  offset: 0,
                  organizationId: entityIds,
                },
              })
              .then((res) => res.data.results),
          getEntityId: (purpose) => purpose.consumer.id,
          items: data.results,
          knodeId: config.knodeId,
        }),
      ]);

      const results = data.results.map((purpose) =>
        toAPI_ProducerPurpose({
          consumer: assertEntityExists(
            consumersMap.get(unsafeBrandExternalId(purpose.consumer.id)),
            `Consumer organization ${purpose.consumer.id} owned by Knode ${purpose.consumer.knodeId} not found for Purpose ${purpose.id}`,
          ),
          eservice: assertEntityExists(
            eservicesMap.get(purpose.eserviceId),
            `E-service ${purpose.eserviceId} not found for Purpose ${purpose.id}`,
          ),
          purpose,
          recentUpdateDays: config.recentUpdateDays,
        }),
      );

      res.send({
        pagination: data.pagination,
        results,
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a paginated list of Purposes for the logged-in producer's E-services",
      operationId: "getProducerPurposes",
      querystring: API_GetProducerPurposesQueryParams,
      response: {
        200: API_ProducerPurposes.meta({
          description: "Producer Purposes retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "List producer Purposes",
      tags: [apiTags.purpose],
    },
    url: "/producer/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Getting Producer Purpose with ID ${req.params.purposeId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data: purpose } = await purposeProcessApi.getPurpose({
        client: purposeProcessClient,
        headers,
        path: { purposeId: req.params.purposeId },
      });

      const consumerKnodeId = KnodeId.parse(purpose.consumer.knodeId);

      const [
        { data: eservice },
        { data: latestVersion },
        { data: consumer },
        { data: agreements },
      ] = await Promise.all([
        eserviceProcessApi.getEservice({
          client: eserviceProcessClient,
          headers,
          path: { eserviceId: purpose.eserviceId },
        }),
        eserviceProcessApi.getEserviceLatestVersion({
          client: eserviceProcessClient,
          headers,
          path: { eserviceId: purpose.eserviceId },
        }),
        remoteResourcesManagerApi.getOrganization({
          client: remoteResourcesManagerClient,
          headers,
          path: { organizationId: purpose.consumer.id },
          query: { knodeId: consumerKnodeId },
        }),
        // Fetching only 1 agreement is sufficient: agreements are ordered by
        // updatedAt DESC in the readmodel, so the first result is the most
        // recently updated one.
        agreementProcessApi.getAgreements({
          client: agreementProcessClient,
          headers,
          query: {
            consumerId: purpose.consumer.id,
            consumerKnodeId,
            eserviceId: purpose.eserviceId,
            limit: 1,
            offset: 0,
          },
        }),
      ]);

      const { data: producer } = await organizationProcessApi.getOrganization({
        client: organizationProcessClient,
        headers,
        path: { organizationId: eservice.producerId },
      });

      const agreement = assertEntityExists(
        agreements.results.at(0),
        `Agreement not found for Purpose ${purpose.id} (eserviceId: ${purpose.eserviceId}, consumerId: ${purpose.consumer.id})`,
      );

      res.status(200).send(
        toAPI_PurposeDetails({
          agreement,
          consumer,
          eservice,
          latestEserviceVersionState: latestVersion.state,
          maxDailyCallsPerConsumer: latestVersion.maxDailyCallsPerConsumer,
          producer: {
            ...producer,
            knodeId: config.knodeId,
          },
          purpose,
        }),
      );
    },
    method: "GET",
    schema: {
      description: "Retrieve a Producer Purpose with details",
      operationId: "getProducerPurposeDetails",
      params: API_PurposeIdPathParam,
      response: {
        200: API_PurposeDetails.meta({
          description: "Producer Purpose details retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get a producer Purpose",
      tags: [apiTags.purpose],
    },
    url: "/producer/purposes/:purposeId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      getUISessionAuthData(authData);

      logger.info(`Reactivating Purpose ${req.params.purposeId} by Producer`);

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await purposeProcessApi.reactivatePurposeByProducer({
        client: purposeProcessClient,
        headers,
        path: { purposeId: req.params.purposeId },
      });

      await pollPurpose(response, headers);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Reactivate a Purpose as Producer",
      operationId: "reactivatePurposeByProducer",
      params: API_PurposeIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Purpose reactivated successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Reactivate a Purpose by producer",
      tags: [apiTags.purpose],
    },
    url: "/producer/purposes/:purposeId/reactivate",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      getUISessionAuthData(authData);

      logger.info(`Suspending Purpose ${req.params.purposeId} by Producer`);

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await purposeProcessApi.suspendPurposeByProducer({
        client: purposeProcessClient,
        headers,
        path: { purposeId: req.params.purposeId },
      });

      await pollPurpose(response, headers);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Suspend a Purpose as Producer",
      operationId: "suspendPurposeByProducer",
      params: API_PurposeIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Purpose suspended successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Suspend a Purpose by producer",
      tags: [apiTags.purpose],
    },
    url: "/producer/purposes/:purposeId/suspend",
  });
};
