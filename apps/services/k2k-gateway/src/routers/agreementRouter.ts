import type { API_CreatedResource } from "@knodia/common-models/api";
import type { TokenGenerator } from "@knodia/token-generator";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import {
  type KnodeId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
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
  API_MagicLink,
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
  magicLinkConfig: MagicLinkConfig;
  pollingService: PollingService;
  tokenGenerator: TokenGenerator;
  tokenProvider: RefreshableInternalTokenGenerator;
}

interface MagicLinkConfig {
  audience: string;
  frontendActivationPath: string;
  frontendBaseUrl: string;
  issuer: string;
  kid: string;
  secondsDuration: number;
}

async function buildActivationMagicLink(
  agreement: agreementProcessApi.Agreement,
  tokenGenerator: TokenGenerator,
  magicLinkConfig: MagicLinkConfig,
) {
  const { payload, serialized } =
    await tokenGenerator.generateExternalUISessionMagicLinkToken({
      agreementId: unsafeBrandId(agreement.id),
      audience: magicLinkConfig.audience,
      consumerId: unsafeBrandExternalId<OrganizationId>(agreement.consumer.id),
      consumerKnodeId: agreement.consumer.knodeId,
      eserviceId: unsafeBrandId(agreement.eserviceId),
      eserviceVersionId: unsafeBrandId(agreement.eserviceVersionId),
      issuer: magicLinkConfig.issuer,
      kid: magicLinkConfig.kid,
      producerId: unsafeBrandId(agreement.producerId),
      scope: "agreement-activation",
      secondsDuration: magicLinkConfig.secondsDuration,
      subject: agreement.id,
    });

  return {
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    url: `${magicLinkConfig.frontendBaseUrl}${magicLinkConfig.frontendActivationPath}?token=${encodeURIComponent(serialized)}`,
  };
}

export const agreementRouter: FastifyPluginAsyncZod<
  AgreementRouterOptions
> = async (
  fastify,
  {
    agreementProcessClient,
    callerKnodeId,
    magicLinkConfig,
    pollingService,
    tokenGenerator,
    tokenProvider,
  },
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
    pollingService.pollResourceWithMetadata(() =>
      retrieveAgreement(response.data.id, headers),
    )({
      condition: isPolledVersionAtLeastResponseVersion(response),
    });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Creating agreement with body data",
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

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
      summary: "Create a new Agreement",
      tags: [apiTags.resource, apiTags.agreement],
    },
    url: "/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(`Getting Agreement with ID ${req.params.agreementId}`);

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

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

      logger.info(
        { requestQuery: req.query },
        "Getting Agreements with query params",
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

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

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { agreementId } = req.params;
      logger.info(
        `Creating activation magic link for Agreement ${agreementId}`,
      );
      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);
      // Agreement state is enforced downstream by agreement-process's activate
      // endpoint (409 propagates via API Problem passthrough).
      const { data: agreement } = await retrieveAgreement(agreementId, headers);
      res
        .status(200)
        .send(
          await buildActivationMagicLink(
            agreement,
            tokenGenerator,
            magicLinkConfig,
          ),
        );
    },
    method: "POST",
    schema: {
      description:
        "Create a magic link for a Consumer user to activate an Agreement on the Producer's frontend",
      operationId: "createAgreementActivationMagicLink",
      params: API_AgreementIdPathParam,
      response: {
        200: API_MagicLink.meta({
          description: "Magic link created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Create an Agreement activation magic link",
      tags: [apiTags.operation, apiTags.agreement],
    },
    url: "/agreements/:agreementId/activationMagicLink",
  });
};
