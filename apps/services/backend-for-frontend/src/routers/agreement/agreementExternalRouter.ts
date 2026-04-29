import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementIdPathParam } from "@knodia/agreement-models/api";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
  type KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  isPolledVersionAtLeastResponseVersion,
  type PollingService,
} from "@knodia/polling";
import z from "zod";

import { apiTags } from "../../models/apiTags.ts";
import { getExternalUiSessionAuthData } from "../../utils/authData.ts";

interface AgreementExternalRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  pollingService: PollingService;
}

export const agreementExternalRouter: FastifyPluginAsyncZod<
  AgreementExternalRouterOptions
> = async (fastify, { agreementProcessClient, pollingService }) => {
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
      getExternalUiSessionAuthData(authData);
      const { agreementId } = req.params;

      logger.info(`Activating Agreement ${agreementId}`);

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await agreementProcessApi.activateAgreement({
        client: agreementProcessClient,
        headers,
        path: { agreementId },
      });

      await pollAgreement(response, headers);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description:
        "Activate an Agreement using a scoped external-ui-session token obtained from the magic-link exchange",
      operationId: "activateAgreement",
      params: API_AgreementIdPathParam,
      response: {
        204: z.undefined().meta({
          description: "Agreement activated successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Activate an Agreement",
      tags: [apiTags.agreement],
    },
    url: "/external/agreements/:agreementId/activate",
  });
};
