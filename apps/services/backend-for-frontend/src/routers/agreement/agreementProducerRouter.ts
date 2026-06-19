/* eslint-disable max-lines-per-function */
import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementIdPathParam } from "@knodia/agreement-models/api";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
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
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";
import z from "zod";

import type { BffProcessConfig } from "../../config/config.ts";

import {
  API_GetProducerAgreementsQueryParams,
  type API_ProducerAgreement,
  API_ProducerAgreementDetails,
  API_ProducerAgreements,
} from "../../models/agreement/api.ts";
import {
  toAPI_ProducerAgreement,
  toAPI_ProducerAgreementDetails,
} from "../../models/agreement/apiConverter.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { getRecentUpdateCutoffDate } from "../../utils/recentUpdate.ts";

const enrichAgreements = async ({
  agreements,
  config,
  eserviceProcessClient,
  headers,
  remoteResourcesManagerClient,
}: {
  agreements: agreementProcessApi.Agreement[];
  config: BffProcessConfig;
  eserviceProcessClient: EserviceProcessClient;
  headers: ReturnType<typeof getKnodiaServiceHeaders>;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}): Promise<API_ProducerAgreement[]> => {
  const eserviceIds = new Set(
    agreements.map((agreement) => agreement.eserviceId),
  );
  const [eservicesMap, consumersMap] = await Promise.all([
    eserviceProcessApi
      .getEservices({
        client: eserviceProcessClient,
        headers,
        query: {
          eserviceId: Array.from(eserviceIds),
          // Safe: agreements and eservices are paginated with the same limit, so unique eservice IDs ≤ limit
          limit: eserviceIds.size,
          offset: 0,
        },
      })
      .then(
        (res) =>
          new Map(res.data.results.map((eservice) => [eservice.id, eservice])),
      ),
    getExternalEntitiesMap({
      fetchFn: ({ entityIds }) =>
        remoteResourcesManagerApi
          .getOrganizations({
            client: remoteResourcesManagerClient,
            headers,
            query: {
              knodeId: config.knodeId,
              // Safe: agreements and consumers are paginated with the same limit, so unique consumer IDs ≤ limit
              limit: entityIds.length,
              offset: 0,
              organizationId: entityIds,
            },
          })
          .then((res) => res.data.results),
      getEntityId: (agreement) => agreement.consumer.id,
      items: agreements,
      knodeId: config.knodeId,
    }),
  ]);

  return agreements.map((agreement) =>
    toAPI_ProducerAgreement({
      agreement,
      consumer: assertEntityExists(
        consumersMap.get(unsafeBrandExternalId(agreement.consumer.id)),
        `Consumer organization ${agreement.consumer.id} owned by Knode ${agreement.consumer.knodeId} not found for Agreement ${agreement.id}`,
      ),
      eservice: assertEntityExists(
        eservicesMap.get(agreement.eserviceId),
        `E-service ${agreement.eserviceId} not found for Agreement ${agreement.id}`,
      ),
      recentUpdateDays: config.recentUpdateDays,
    }),
  );
};

interface AgreementProducerRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  config: BffProcessConfig;
  eserviceProcessClient: EserviceProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  pollingService: PollingService;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const agreementProducerRouter: FastifyPluginAsyncZod<
  AgreementProducerRouterOptions
> = async (
  fastify,
  {
    agreementProcessClient,
    config,
    eserviceProcessClient,
    organizationProcessClient,
    pollingService,
    remoteResourcesManagerClient,
  },
) => {
  const retrieveAgreementById = (
    agreementId: string,
    headers: KnodiaServiceHeaders,
  ) =>
    agreementProcessApi.getAgreement({
      client: agreementProcessClient,
      headers,
      path: { agreementId },
    });

  const pollAgreement = (
    response: AxiosResponse<agreementProcessApi.Agreement>,
    headers: KnodiaServiceHeaders,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrieveAgreementById(response.data.id, headers),
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
        "Getting Producer Agreements with query parameters",
      );

      const { eserviceId, limit, offset, recentlyUpdated, state } = req.query;
      const headers = getKnodiaServiceHeaders(req, correlationId);

      const updatedSince = recentlyUpdated
        ? getRecentUpdateCutoffDate(config.recentUpdateDays).toISOString()
        : undefined;

      const { data } = await agreementProcessApi.getAgreements({
        client: agreementProcessClient,
        headers,
        query: {
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
      const results = await enrichAgreements({
        agreements: data.results,
        config,
        eserviceProcessClient,
        headers,
        remoteResourcesManagerClient,
      });

      res.send({
        pagination: data.pagination,
        results,
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a paginated list of Agreements produced by the logged-in user's organization",
      operationId: "getProducerAgreements",
      querystring: API_GetProducerAgreementsQueryParams,
      response: {
        200: API_ProducerAgreements.meta({
          description: "Producer Agreements retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "List producer Agreements",
      tags: [apiTags.agreement],
    },
    url: "/producer/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Getting Producer Agreement with ID ${req.params.agreementId}`,
      );

      const { data: agreement } = await agreementProcessApi.getAgreement({
        client: agreementProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { agreementId: req.params.agreementId },
      });

      const [
        { data: eservice },
        { data: latestVersion },
        { data: producer },
        { data: consumer },
      ] = await Promise.all([
        eserviceProcessApi.getEservice({
          client: eserviceProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { eserviceId: agreement.eserviceId },
        }),
        eserviceProcessApi.getEserviceLatestVersion({
          client: eserviceProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { eserviceId: agreement.eserviceId },
        }),
        organizationProcessApi.getOrganization({
          client: organizationProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { organizationId: agreement.producerId },
        }),
        remoteResourcesManagerApi.getOrganization({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { organizationId: agreement.consumer.id },
          query: { knodeId: agreement.consumer.knodeId },
        }),
      ]);

      res.status(200).send(
        toAPI_ProducerAgreementDetails({
          agreement,
          consumer,
          eservice,
          latestEserviceVersionState: latestVersion.state,
          producer: {
            ...producer,
            knodeId: config.knodeId,
          },
        }),
      );
    },
    method: "GET",
    schema: {
      description: "Retrieve a Producer Agreement with all its details",
      operationId: "getProducerAgreementDetails",
      params: API_AgreementIdPathParam,
      response: {
        200: API_ProducerAgreementDetails.meta({
          description: "Producer Agreement details retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get a producer Agreement",
      tags: [apiTags.agreement],
    },
    url: "/producer/agreements/:agreementId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      getUISessionAuthData(authData);

      logger.info(`Reactivating Producer Agreement ${req.params.agreementId}`);

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await agreementProcessApi.reactivateAgreementByProducer({
        client: agreementProcessClient,
        headers,
        path: { agreementId: req.params.agreementId },
      });

      await pollAgreement(response, headers);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Reactivate an Agreement as Producer",
      operationId: "reactivateAgreementByProducer",
      params: API_AgreementIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Agreement reactivated successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Reactivate an Agreement by producer",
      tags: [apiTags.agreement],
    },
    url: "/producer/agreements/:agreementId/reactivate",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      getUISessionAuthData(authData);

      logger.info(`Suspending Producer Agreement ${req.params.agreementId}`);

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await agreementProcessApi.suspendAgreementByProducer({
        client: agreementProcessClient,
        headers,
        path: { agreementId: req.params.agreementId },
      });

      await pollAgreement(response, headers);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Suspend an Agreement as Producer",
      operationId: "suspendAgreementByProducer",
      params: API_AgreementIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Agreement suspended successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Suspend an Agreement by producer",
      tags: [apiTags.agreement],
    },
    url: "/producer/agreements/:agreementId/suspend",
  });
};
