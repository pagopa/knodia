import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { genericInternalError } from "@knodia/common-models/errors";
import { unsafeBrandId } from "@knodia/common-models/ids";
import {
  eserviceProcessApi,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import { getOrganization } from "@knodia/organization-models";

import {
  API_GetProducerAgreementsQueryParams,
  API_ProducerAgreements,
} from "../../models/agreement/api.ts";
import { toAPI_ProducerAgreement } from "../../models/agreement/apiConverter.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface AgreementProducerRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
}

export const agreementProducerRouter: FastifyPluginAsyncZod<
  AgreementProducerRouterOptions
> = async (fastify, { agreementProcessClient, eserviceProcessClient }) => {
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
};
