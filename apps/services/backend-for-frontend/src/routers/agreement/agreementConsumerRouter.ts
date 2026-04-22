import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  API_ActivationMagicLinkRequest,
  API_AgreementIdPathParam,
  API_MagicLink,
} from "@knodia/agreement-models/api";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
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

interface AgreementConsumerRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const agreementConsumerRouter: FastifyPluginAsyncZod<
  AgreementConsumerRouterOptions
> = async (fastify, { remoteResourcesManagerClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);

      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { requestBody: req.body },
        `Creating agreement for consumer ${consumerId} on knode ${req.body.knodeId}`,
      );

      const { data } = await remoteResourcesManagerApi.createAgreement({
        body: {
          eserviceId: req.body.eserviceId,
          eserviceVersionId: req.body.eserviceVersionId,
          knodeId: req.body.knodeId,
        },
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
      });

      res.status(201).send({ id: data.id });
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
      summary: "Create a consumer Agreement",
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(`Getting Consumer Agreements for Consumer ID ${consumerId}`);

      const [
        { data: activeAgreements },
        { data: suspendedAgreements },
        { data: archivedAgreements },
      ] = await Promise.all([
        remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            limit: 1,
            offset: 0,
            state: "Active",
          },
        }),
        remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            limit: 1,
            offset: 0,
            state: "Suspended",
          },
        }),
        remoteResourcesManagerApi.getAgreements({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
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

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        `Creating activation magic link for Agreement ${req.params.agreementId} requested by Consumer ${consumerId} on Knode ${req.body.knodeId}`,
      );

      const { data } =
        await remoteResourcesManagerApi.createAgreementActivationMagicLink({
          body: { knodeId: req.body.knodeId },
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { agreementId: req.params.agreementId },
        });

      res.status(200).send(data);
    },
    method: "POST",
    schema: {
      body: API_ActivationMagicLinkRequest,
      description:
        "Request a magic link for a Consumer user to activate an Agreement on the Producer Knode's frontend",
      operationId: "createConsumerAgreementActivationMagicLink",
      params: API_AgreementIdPathParam,
      response: {
        200: API_MagicLink.meta({
          description: "Magic link created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Agreement not found" }),
      },
      summary: "Create an Agreement activation magic link",
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements/:agreementId/activationMagicLink",
  });
};
