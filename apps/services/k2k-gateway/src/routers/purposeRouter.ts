import type { KnodeId } from "@knodia/common-models/ids";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  type KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  isPolledVersionAtLeastResponseVersion,
  type PollingService,
} from "@knodia/polling";
import {
  purposeProcessApi,
  type PurposeProcessClient,
} from "@knodia/purpose-process-client";

import { apiTags } from "../models/apiTags.ts";
import {
  API_CreatedPurposeResource,
  API_PurposeSeed,
} from "../models/purpose/api.ts";
import { toProcessAPI_PurposeSeed } from "../models/purpose/apiConverter.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

interface PurposeRouterOptions {
  callerKnodeId: KnodeId;
  pollingService: PollingService;
  purposeProcessClient: PurposeProcessClient;
  tokenProvider: RefreshableInternalTokenGenerator;
}

export const purposeRouter: FastifyPluginAsyncZod<
  PurposeRouterOptions
> = async (
  fastify,
  { callerKnodeId, pollingService, purposeProcessClient, tokenProvider },
) => {
  const retrievePurpose = async (
    purposeId: string,
    headers: KnodiaServiceHeaders,
  ) =>
    await purposeProcessApi.getPurpose({
      client: purposeProcessClient,
      headers,
      path: { purposeId },
    });

  const pollPurpose = (
    response: AxiosResponse<API_CreatedResource>,
    headers: KnodiaServiceHeaders,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrievePurpose(response.data.id, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info({ requestBody: req.body }, "Creating purpose with body data");

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const response = await purposeProcessApi.createPurpose({
        body: toProcessAPI_PurposeSeed(req.body, callerKnodeId),
        client: purposeProcessClient,
        headers,
      });

      await pollPurpose(response, headers);

      res.status(201).send({
        id: response.data.id,
      });
    },
    method: "POST",
    schema: {
      body: API_PurposeSeed,
      description:
        "Create a new Purpose for a Consumer to declare the intended use of a Producer's E-service",
      operationId: "createPurpose",
      response: {
        201: API_CreatedPurposeResource.meta({
          description: "Purpose created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Create a new Purpose",
      tags: [apiTags.resource, apiTags.purpose],
    },
    url: "/purposes",
  });
};
