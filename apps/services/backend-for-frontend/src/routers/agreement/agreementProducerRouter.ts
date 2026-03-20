/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementIdPathParam } from "@knodia/agreement-models/api";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import {
  type ExternalId,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";
import { KnodeId, OrganizationId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import {
  eserviceProcessApi,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  genericError,
} from "@knodia/fastify-zod-api-commons/models";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

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
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface AgreementProducerRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
  knodeId: KnodeId;
  organizationProcessClient: OrganizationProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const agreementProducerRouter: FastifyPluginAsyncZod<
  AgreementProducerRouterOptions
> = async (
  fastify,
  {
    agreementProcessClient,
    eserviceProcessClient,
    knodeId,
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

      const { limit, offset } = req.query;

      const { data } = await agreementProcessApi.getAgreements({
        client: agreementProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: {
          limit,
          offset,
          producerId,
        },
      });

      const eserviceIds = new Set(
        data.items.map((agreement) => agreement.eserviceId),
      );
      const eservices = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: {
          eserviceId: Array.from(eserviceIds),
          // Safe: agreements and eservices are paginated with the same limit, so unique eservice IDs ≤ limit
          limit: eserviceIds.size,
          offset: 0,
        },
      });
      const eservicesMap = new Map(
        eservices.data.items.map((eservice) => [eservice.id, eservice]),
      );

      const consumerIds = new Map<
        API_KnodeId,
        Set<ExternalId<OrganizationId>>
      >();
      data.items.forEach((agreement) => {
        const consumerId = unsafeBrandExternalId<OrganizationId>(
          agreement.consumer.id,
        );
        const knodeId = API_KnodeId.parse(agreement.consumer.knodeId);
        const consumerIdsByKnode =
          consumerIds.get(knodeId) ?? new Set<ExternalId<OrganizationId>>();
        if (!consumerIds.has(knodeId)) {
          consumerIds.set(knodeId, consumerIdsByKnode);
        }
        consumerIdsByKnode.add(consumerId);
      });
      const consumersMap = new Map<
        API_KnodeId,
        Map<ExternalId<OrganizationId>, remoteResourcesManagerApi.Organization>
      >();
      // TODO: fetch the consumers with getOrganizations instead
      await Promise.all(
        Array.from(consumerIds.entries()).flatMap(
          ([knodeId, consumerIdsByKnode]) =>
            Array.from(consumerIdsByKnode).map(async (consumerId) => {
              const { data: consumer } =
                await remoteResourcesManagerApi.getOrganization({
                  client: remoteResourcesManagerClient,
                  headers: getKnodiaServiceHeaders(req, correlationId),
                  path: { organizationId: consumerId },
                  query: { knodeId },
                });

              const consumersByKnode =
                consumersMap.get(knodeId) ??
                new Map<
                  ExternalId<OrganizationId>,
                  remoteResourcesManagerApi.Organization
                >();
              if (!consumersMap.has(knodeId)) {
                consumersMap.set(knodeId, consumersByKnode);
              }
              consumersByKnode.set(consumerId, consumer);
            }),
        ),
      );

      const items = data.items.map((agreement) => {
        const eservice = eservicesMap.get(agreement.eserviceId);
        if (!eservice) {
          throw genericError(
            `E-service ${agreement.eserviceId} not found for Agreement ${agreement.id}`,
          );
        }

        const consumer = consumersMap
          .get(agreement.consumer.knodeId)
          ?.get(unsafeBrandExternalId(agreement.consumer.id));
        if (!consumer) {
          throw genericError(
            `Consumer organization ${agreement.consumer.id} not found for Agreement ${agreement.id}`,
          );
        }

        return toAPI_ProducerAgreement({
          agreement,
          consumer,
          eservice,
        });
      });

      res.send({
        items,
        pagination: data.pagination,
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
            knodeId,
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
