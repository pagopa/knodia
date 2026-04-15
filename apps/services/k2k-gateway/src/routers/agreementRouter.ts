import type { API_CreatedResource } from "@knodia/common-models/api";
import type { CorrelationId, KnodeId } from "@knodia/common-models/ids";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
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
  API_Agreement,
  API_AgreementIdPathParam,
  API_Agreements,
  API_AgreementSeed,
  API_CreatedAgreementResource,
  API_GetAgreementsQueryParams,
} from "../models/agreement/api.ts";
import {
  toAPI_Agreement,
  toProcessAPI_AgreementSeed,
  toProcessAPI_AgreementState,
} from "../models/agreement/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

interface AgreementRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  callerKnodeId: KnodeId;
  pollingService: PollingService;
  tokenProvider: RefreshableInternalTokenGenerator;
}

function makePollAgreement(
  agreementProcessClient: AgreementProcessClient,
  pollingService: PollingService,
) {
  const retrieveAgreement = async (
    agreementId: string,
    headers: KnodiaServiceHeaders,
  ) =>
    await agreementProcessApi.getAgreement({
      client: agreementProcessClient,
      headers,
      path: { agreementId },
    });

  return (
    response: AxiosResponse<API_CreatedResource>,
    headers: KnodiaServiceHeaders,
  ) =>
    pollingService.pollResourceWithMetadata(() =>
      retrieveAgreement(response.data.id, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });
}

export const agreementRouter: FastifyPluginAsyncZod<
  AgreementRouterOptions
> = async (
  fastify,
  { agreementProcessClient, callerKnodeId, pollingService, tokenProvider },
) => {
  const pollAgreement = makePollAgreement(
    agreementProcessClient,
    pollingService,
  );
  const getHeaders = async (correlationId: CorrelationId) =>
    getKnodiaServiceHeaders(correlationId, await tokenProvider.get());

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info({ requestBody: req.body }, "Creating Agreement");

      const headers = await getHeaders(correlationId);

      const response = await agreementProcessApi.createAgreement({
        body: toProcessAPI_AgreementSeed(req.body, callerKnodeId),
        client: agreementProcessClient,
        headers,
      });

      await pollAgreement(response, headers);

      res.status(201).send({
        id: response.data.id,
        producerId: response.data.producerId,
      });
    },
    method: "POST",
    schema: {
      body: API_AgreementSeed,
      description:
        "Create a new Agreement for a Consumer to access a Producer's E-service",
      operationId: "createAgreement",
      response: {
        201: API_CreatedAgreementResource.meta({
          description: "Agreement created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.resource, apiTags.agreement],
    },
    url: "/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(`Getting Agreement with ID ${req.params.agreementId}`);

      const headers = await getHeaders(correlationId);

      const { data } = await agreementProcessApi.getAgreement({
        client: agreementProcessClient,
        headers,
        path: { agreementId: req.params.agreementId },
      });

      res.send(toAPI_Agreement(data));
    },
    method: "GET",
    schema: {
      description: "Retrieve an Agreement",
      operationId: "getAgreement",
      params: API_AgreementIdPathParam,
      response: {
        200: API_Agreement.meta({
          description: "Agreement retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.resource, apiTags.agreement],
    },
    url: "/agreements/:agreementId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(`Reactivating Agreement ${req.params.agreementId}`);

      const headers = await getHeaders(correlationId);

      const { data } = await agreementProcessApi.reactivateAgreementByConsumer({
        client: agreementProcessClient,
        headers,
        path: { agreementId: req.params.agreementId },
      });

      res.send(toAPI_Agreement(data));
    },
    method: "POST",
    schema: {
      description: "Reactivate an Agreement",
      operationId: "reactivateAgreement",
      params: API_AgreementIdPathParam,
      response: {
        200: API_Agreement.meta({
          description: "Agreement reactivated successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.resource, apiTags.agreement],
    },
    url: "/agreements/:agreementId/reactivation",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(`Suspending Agreement ${req.params.agreementId}`);

      const headers = await getHeaders(correlationId);

      const { data } = await agreementProcessApi.suspendAgreementByConsumer({
        client: agreementProcessClient,
        headers,
        path: { agreementId: req.params.agreementId },
      });

      res.send(toAPI_Agreement(data));
    },
    method: "POST",
    schema: {
      description: "Suspend an Agreement",
      operationId: "suspendAgreement",
      params: API_AgreementIdPathParam,
      response: {
        200: API_Agreement.meta({
          description: "Agreement suspended successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.resource, apiTags.agreement],
    },
    url: "/agreements/:agreementId/suspension",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestQuery: req.query },
        "Getting Agreements with query params",
      );

      const headers = await getHeaders(correlationId);

      const { consumerId, eserviceId, limit, offset, state } = req.query;

      const { data } = await agreementProcessApi.getAgreements({
        client: agreementProcessClient,
        headers,
        query: {
          consumerId,
          consumerKnodeId: callerKnodeId,
          eserviceId,
          limit,
          offset,
          state: state ? [toProcessAPI_AgreementState(state)] : undefined,
        },
      });

      res.status(200).send({
        pagination: data.pagination,
        results: data.results.map(toAPI_Agreement),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Agreements",
      operationId: "getAgreements",
      querystring: API_GetAgreementsQueryParams,
      response: {
        200: API_Agreements.meta({
          description: "Agreements retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      tags: [apiTags.resource, apiTags.agreement],
    },
    url: "/agreements",
  });
};
