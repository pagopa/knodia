import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import {
  API_AgreementSeed,
  API_ConsumerAgreements,
} from "../../models/agreement/api.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";
import {
  isPolledVersionAtLeastResponseVersion,
  pollResourceWithMetadata,
} from "../../utils/polling.ts";

interface AgreementConsumerRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const agreementConsumerRouter: FastifyPluginAsyncZod<
  AgreementConsumerRouterOptions
> = async (
  fastify,
  { agreementProcessClient, remoteResourcesManagerClient },
) => {
  const retrieveAgreement = async (
    agreementId: string,
    headers: KnodiaServiceHeaders,
  ) =>
    await agreementProcessApi.getAgreement({
      client: agreementProcessClient,
      headers,
      path: { agreementId },
    });

  const pollAgreement = (
    response: AxiosResponse<API_CreatedResource>,
    headers: KnodiaServiceHeaders,
  ) =>
    pollResourceWithMetadata(() =>
      retrieveAgreement(response.data.id, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);

      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { requestBody: req.body },
        `Creating agreement for consumer ${consumerId} on knode ${req.body.knodeId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const response = await remoteResourcesManagerApi.createAgreement({
        body: {
          eserviceId: req.body.eserviceId,
          eserviceVersionId: req.body.eserviceVersionId,
          knodeId: req.body.knodeId,
        },
        client: remoteResourcesManagerClient,
        headers,
      });

      await pollAgreement(response, headers);

      res.status(201).send({ id: response.data.id });
    },
    method: "POST",
    schema: {
      body: API_AgreementSeed,
      description:
        "Create a new Agreement for the consumer to access a Producer's E-service",
      operationId: "createConsumerAgreement",
      response: {
        201: API_CreatedResource.meta({
          description: "Agreement created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Create a consumer agreement",
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(`Getting Consumer Agreements for consumer ID ${consumerId}`);

      const [
        { data: activeAgreements },
        { data: suspendedAgreements },
        { data: archivedAgreements },
      ] = await Promise.all([
        remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            consumerId,
            limit: 1,
            offset: 0,
            state: "Active",
          },
        }),
        remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            consumerId,
            limit: 1,
            offset: 0,
            state: "Suspended",
          },
        }),
        remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            consumerId,
            limit: 1,
            offset: 0,
            state: "Archived",
          },
        }),
      ]);

      res.status(200).send({
        counters: {
          activeAgreements: activeAgreements.pagination.total,
          archivedAgreements: archivedAgreements.pagination.total,
          suspendedAgreements: suspendedAgreements.pagination.total,
        },
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Consumer Agreements",
      operationId: "getConsumerAgreements",
      response: {
        200: API_ConsumerAgreements.meta({
          description: "Consumer Agreements retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements",
  });
};
