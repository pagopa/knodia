import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_EserviceIdPathParam } from "@knodia/eservice-models/api";
import { eserviceProcessApi } from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  CORRELATION_ID_HEADER,
  genericError,
} from "@knodia/fastify-zod-api-commons/models";

import { type EserviceProcessClient } from "../clients/clientsProvider.ts";
import { API_EserviceDetails } from "../models/api.ts";
import { toAPI_EserviceDetails } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface EserviceDetailRouterOptions {
  eserviceProcessClient: EserviceProcessClient;
}

export const eserviceDetailRouter: FastifyPluginAsyncZod<
  EserviceDetailRouterOptions
> = async (fastify, { eserviceProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId } = getContextValues(requestContext);

      const headers = { [CORRELATION_ID_HEADER]: correlationId };
      const path = { eserviceId: req.params.eserviceId };

      const [eserviceResult, versionResult] = await Promise.all([
        eserviceProcessApi.getEserviceById({
          client: eserviceProcessClient,
          headers,
          path,
        }),
        eserviceProcessApi.getEserviceVersion({
          client: eserviceProcessClient,
          headers,
          path,
        }),
      ]);

      if (!eserviceResult.data || !versionResult.data) {
        throw genericError(
          "Unexpected empty response from eservice-process on getEserviceDetails",
        );
      }

      // TODO: fetch real counts from agreement-process and purpose-process
      res.send(
        toAPI_EserviceDetails(eserviceResult.data, versionResult.data, {
          agreements: { active: 3, total: 5 },
          purposes: { active: 1, total: 2 },
        }),
      );
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service with all its details",
      operationId: "getEserviceDetails",
      params: API_EserviceIdPathParam,
      response: {
        200: API_EserviceDetails.describe(
          "E-service details retrieved successfully",
        ),
        400: API_Problem.describe("Bad Request"),
        404: API_Problem.describe("E-service not found"),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId",
  });
};
