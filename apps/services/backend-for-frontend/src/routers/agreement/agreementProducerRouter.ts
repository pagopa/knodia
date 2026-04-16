import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  API_AgreementIdPathParam,
  API_AgreementState,
} from "@knodia/agreement-models/api";
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
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import type { BffProcessConfig } from "../../config/config.ts";

import {
  API_GetProducerAgreementsQueryParams,
  API_ProducerAgreementDetails,
  API_ProducerAgreements,
} from "../../models/agreement/api.ts";
import {
  toAPI_ProducerAgreement,
  toAPI_ProducerAgreementDetails,
} from "../../models/agreement/apiConverter.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

const producerVisibleStates: API_AgreementState[] = [
  API_AgreementState.enum.Active,
  API_AgreementState.enum.Suspended,
];

interface AgreementProducerRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  config: BffProcessConfig;
  eserviceProcessClient: EserviceProcessClient;
  organizationProcessClient: OrganizationProcessClient;
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
    remoteResourcesManagerClient,
  },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: producerId } = getUISessionAuthData(authData);

      logger.info(
        { requestQuery: req.query },
        "Getting Producer Agreements with query parameters",
      );

      const { eserviceId, limit, offset } = req.query;

      const { data } = await agreementProcessApi.getAgreements({
        client: agreementProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: {
          eserviceId,
          limit,
          offset,
          producerId,
          state: producerVisibleStates,
        },
      });

      if (data.results.length === 0) {
        res.send({ pagination: data.pagination, results: [] });
        return;
      }

      const eserviceIds = new Set(
        data.results.map((agreement) => agreement.eserviceId),
      );
      const [eservicesMap, consumersMap] = await Promise.all([
        eserviceProcessApi
          .getEservices({
            client: eserviceProcessClient,
            headers: getKnodiaServiceHeaders(req, correlationId),
            query: {
              eserviceId: Array.from(eserviceIds),
              // Safe: agreements and eservices are paginated with the same limit, so unique eservice IDs ≤ limit
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
                  // Safe: agreements and consumers are paginated with the same limit, so unique consumer IDs ≤ limit
                  limit: entityIds.length,
                  offset: 0,
                  organizationId: entityIds,
                },
              })
              .then((res) => res.data.results),
          getEntityId: (agreement) => agreement.consumer.id,
          getKnodeId: (agreement) => KnodeId.parse(agreement.consumer.knodeId),
          items: data.results,
        }),
      ]);

      const results = data.results.map((agreement) =>
        toAPI_ProducerAgreement({
          agreement,
          consumer: assertEntityExists(
            consumersMap
              .get(agreement.consumer.knodeId)
              ?.get(unsafeBrandExternalId(agreement.consumer.id)),
            `Consumer organization ${agreement.consumer.id} owned by Knode ${agreement.consumer.knodeId} not found for Agreement ${agreement.id}`,
          ),
          eservice: assertEntityExists(
            eservicesMap.get(agreement.eserviceId),
            `E-service ${agreement.eserviceId} not found for Agreement ${agreement.id}`,
          ),
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
      },
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
      },
      tags: [apiTags.agreement],
    },
    url: "/producer/agreements/:agreementId",
  });
};
