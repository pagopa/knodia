import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { eserviceProcessApi } from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  CORRELATION_ID_HEADER,
} from "@knodia/fastify-zod-api-commons/models";

import { type EserviceProcessClient } from "../clients/clientsProvider.ts";
import {
  API_ProducerEservices,
  API_ProducerEservicesQueryParams,
} from "../models/api.ts";
import { toAPI_ProducerEservice } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface ProducerEserviceRouterOptions {
  eserviceProcessClient: EserviceProcessClient;
}

export const producerEserviceRouter: FastifyPluginAsyncZod<
  ProducerEserviceRouterOptions
> = async (fastify, { eserviceProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { limit, mode, offset, q, sortOrder, state } = req.query;
      const { correlationId } = getContextValues(requestContext);

      // TODO: get real producerId from auth context
      const producerId = "00000000-0000-0000-0000-000000000000";

      // TODO: Implement sorting by activeAgreements/activePurposes.
      // Currently falls back to name sorting. Two options:
      // 1. BFF-side: fetch ALL eservices (no process pagination), enrich, sort, paginate here.
      //    Breaks process pagination; only viable if producer eservice count is bounded.
      // 2. Process-side: get counts in eservice-process and handle sorting.
      //    Breaks unified data model principle (process would include cross-domain data).

      const { data } = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
        query: {
          limit,
          mode,
          offset,
          producerId,
          q,
          sortBy: "name",
          sortOrder,
          state,
        },
      });

      // TODO: fetch real counts from agreement-process and purpose-process (maybe batch endpoint)
      const items = data.items.map((eservice, idx) =>
        toAPI_ProducerEservice(eservice, idx + 5, idx + 1),
      );

      res.send({
        items,
        pagination: data.pagination,
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a paginated list of E-services produced by the logged-in user's organization",
      operationId: "getProducerEservices",
      querystring: API_ProducerEservicesQueryParams,
      response: {
        200: API_ProducerEservices.describe(
          "Producer E-services retrieved successfully",
        ),
        400: API_Problem.describe("Bad Request"),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices",
  });
};
