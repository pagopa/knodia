import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementIdPathParam } from "@knodia/agreement-models/api";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { genericInternalError } from "@knodia/common-models/errors";
import { KnodeId, unsafeBrandId } from "@knodia/common-models/ids";
import {
  eserviceProcessApi,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import { getOrganization } from "@knodia/organization-models";

import {
  API_GetProducerAgreementsQueryParams,
  API_ProducerAgreement,
  API_ProducerAgreements,
} from "../../models/agreement/api.ts";
import { toAPI_ProducerAgreement } from "../../models/agreement/apiConverter.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface AgreementProducerRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
  knodeId: KnodeId;
}

export const agreementProducerRouter: FastifyPluginAsyncZod<
  AgreementProducerRouterOptions
> = async (
  fastify,
  { agreementProcessClient, eserviceProcessClient, knodeId },
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

      const {
        consumerId,
        consumerKnodeId,
        eserviceId,
        limit,
        offset,
        sortBy,
        sortOrder,
        state,
      } = req.query;

      const { data } = await agreementProcessApi.getAgreements({
        client: agreementProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: {
          consumerId,
          consumerKnodeId,
          eserviceId,
          limit,
          offset,
          producerId,
          sortBy,
          sortOrder,
          state,
        },
      });

      const items = await Promise.all(
        data.items.map(async (agreement) => {
          const { data: eservice } = await eserviceProcessApi.getEservice({
            client: eserviceProcessClient,
            headers: getKnodiaServiceHeaders(req, correlationId),
            path: { eserviceId: agreement.eserviceId },
          });

          // TODO: should this use the remote-resources-manager to fetch the consumer organization from agreement.consumer.knodeId?
          const consumer = getOrganization(
            unsafeBrandId(agreement.consumer.id),
          );
          if (!consumer) {
            throw genericInternalError("Consumer organization not found");
          }

          return toAPI_ProducerAgreement({
            agreement,
            consumer,
            eservice,
          });
        }),
      );

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

      const { data: eservice } = await eserviceProcessApi.getEservice({
        client: eserviceProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { eserviceId: agreement.eserviceId },
      });

      // TODO: fetch this with organization-process
      const producer = getOrganization(unsafeBrandId(agreement.producerId));
      if (!producer) {
        throw genericInternalError("Producer organization not found");
      }

      // TODO: should this use the remote-resources-manager to fetch the consumer organization from agreement.consumer.knodeId?
      const consumer = getOrganization(unsafeBrandId(agreement.consumer.id));
      if (!consumer) {
        throw genericInternalError("Consumer organization not found");
      }

      res.status(200).send(
        toAPI_ProducerAgreement({
          agreement,
          consumer,
          eservice,
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
        200: API_ProducerAgreement.meta({
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
