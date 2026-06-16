import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import {
  eserviceProcessApi,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
  type KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import {
  isPolledVersionAtLeastResponseVersion,
  type PollingService,
} from "@knodia/polling";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";
import z from "zod";

import type { BffProcessConfig } from "../../config/config.ts";

import { API_AgreementActivationDetails } from "../../models/agreement/api.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getExternalUISessionAuthData } from "../../utils/authData.ts";

interface AgreementExternalRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  config: BffProcessConfig;
  eserviceProcessClient: EserviceProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  pollingService: PollingService;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const agreementExternalRouter: FastifyPluginAsyncZod<
  AgreementExternalRouterOptions
> = async (
  fastify,
  {
    agreementProcessClient,
    config,
    eserviceProcessClient,
    organizationProcessClient,
    pollingService,
    remoteResourcesManagerClient,
  },
) => {
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
      const externalAuthData = getExternalUISessionAuthData(authData);
      const agreementId = externalAuthData.agreement.id;

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
        "Activate the Agreement embedded in the external-ui-session token claims",
      operationId: "activateAgreement",
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
    url: "/external/agreementActivation/activate",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const externalAuthData = getExternalUISessionAuthData(authData);
      const agreementId = externalAuthData.agreement.id;

      logger.info(`Getting activation details for Agreement ${agreementId}`);

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const agreementResp = await agreementProcessApi.getAgreement({
        client: agreementProcessClient,
        headers,
        path: { agreementId },
      });

      const [eserviceResp, producerResp, consumerResp] = await Promise.all([
        eserviceProcessApi.getEservice({
          client: eserviceProcessClient,
          headers,
          path: { eserviceId: agreementResp.data.eserviceId },
        }),
        organizationProcessApi.getOrganization({
          client: organizationProcessClient,
          headers,
          path: { organizationId: agreementResp.data.producerId },
        }),
        remoteResourcesManagerApi.getOrganization({
          client: remoteResourcesManagerClient,
          headers,
          path: { organizationId: agreementResp.data.consumer.id },
          query: { knodeId: agreementResp.data.consumer.knodeId },
        }),
      ]);

      res.status(200).send({
        agreement: {
          id: agreementResp.data.id,
          state: agreementResp.data.state,
        },
        consumer: {
          id: consumerResp.data.id,
          knodeId: agreementResp.data.consumer.knodeId,
          name: consumerResp.data.name,
        },
        eservice: {
          id: eserviceResp.data.id,
          name: eserviceResp.data.name,
        },
        knodeId: config.knodeId,
        producer: {
          id: producerResp.data.id,
          name: producerResp.data.name,
        },
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the recap details (e-service, producer, consumer, agreement state) for the Agreement embedded in the external-ui-session token",
      operationId: "getAgreementActivationDetails",
      response: {
        200: API_AgreementActivationDetails.meta({
          description: "Agreement activation details retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Get Agreement activation details",
      tags: [apiTags.agreement],
    },
    url: "/external/agreementActivation/details",
  });
};
