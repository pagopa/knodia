import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementIdPathParam } from "@knodia/agreement-models/api";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
  MetadataVersionHeader,
  setMetadataVersionHeader,
} from "@knodia/fastify-zod-api-commons/models";

import { API_ExternalAgreement } from "../../models/agreement/api.ts";
import { apiTags } from "../../models/apiTags.ts";

interface AgreementExternalRouterOptions {
  agreementProcessClient: AgreementProcessClient;
}

export const agreementExternalRouter: FastifyPluginAsyncZod<
  AgreementExternalRouterOptions
> = async (fastify, { agreementProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = validateAuthorization(
        getContextValues(requestContext),
        [{ scope: "agreement-activation", tokenType: "external-ui-session" }],
      );
      const { agreementId } = req.params;

      logger.info(`Activating Agreement ${agreementId}`);

      // Forward the caller's external-ui-session Authorization header to
      // agreement-process, which requires that exact token type (it does not
      // accept internal tokens on this endpoint).
      const response = await agreementProcessApi.activateAgreement({
        client: agreementProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { agreementId },
      });

      const metadataVersion = Number(response.headers["metadata-version"]);
      if (Number.isFinite(metadataVersion)) {
        setMetadataVersionHeader(res, metadataVersion);
      }

      res.status(200).send(response.data);
    },
    method: "POST",
    schema: {
      description:
        "Activate an Agreement using a scoped external-ui-session token obtained from the magic-link exchange",
      operationId: "activateAgreement",
      params: API_AgreementIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_ExternalAgreement.meta({
            description: "Agreement activated successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Activate an Agreement",
      tags: [apiTags.agreement],
    },
    url: "/agreements/:agreementId/activate",
  });
};
