import type { Organization } from "@knodia/organization-models";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementIdPathParam } from "@knodia/agreement-models/api";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { KnodeId, unsafeBrandId } from "@knodia/common-models/ids";
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
      const eserviceMap = new Map(
        eservices.data.items.map((eservice) => [eservice.id, eservice]),
      );

      const items = data.items.map((agreement) => {
        const eservice = eserviceMap.get(agreement.eserviceId);
        if (!eservice) {
          throw genericError(
            `E-service ${agreement.eserviceId} not found for Agreement ${agreement.id}`,
          );
        }

        // TODO: use the remote-resources-manager to fetch consumer organizations from agreement.consumer.knodeId,
        // in batch before the loop (same pattern as eservices above:
        // extract unique consumer IDs, add an organizationId filter to getOrganizations, batch-fetch, zip via Map)
        const consumer: Organization = {
          attributes: [],
          createdAt: new Date(),
          id: unsafeBrandId(agreement.consumer.id),
          name: "Consumer Organization Name",
          updatedAt: new Date(),
        };

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

      const [{ data: eservice }, { data: producer }] = await Promise.all([
        eserviceProcessApi.getEservice({
          client: eserviceProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { eserviceId: agreement.eserviceId },
        }),
        organizationProcessApi.getOrganization({
          client: organizationProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { organizationId: agreement.producerId },
        }),
      ]);

      // TODO: fetch this with RRM
      const consumer: Organization = {
        attributes: [],
        createdAt: new Date(),
        id: unsafeBrandId(agreement.consumer.id),
        name: "Consumer Organization Name",
        updatedAt: new Date(),
      };

      res.status(200).send(
        toAPI_ProducerAgreementDetails({
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
