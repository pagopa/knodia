import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type KnodeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import {
  COMPANIES_MOCK_ESERVICE_ID,
  COMPANIES_MOCK_ESERVICE_VERSION_ID,
  COMPANIES_MOCK_PRODUCER_ID,
} from "../companies/mockup.ts";
import { findEvidences, findLegalEntity } from "../data/legalEntities.ts";
import {
  API_CompanyUid,
  API_Evidence,
  API_EvidenceType,
  API_LegalEntity,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { legalEntityNotFound } from "../models/errors.ts";
import { type SignalHubSeedConfig } from "../signalHub/rotation.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

interface MockCompaniesRouterOptions {
  knodeId: KnodeId;
  seedConfig: SignalHubSeedConfig;
}

export const mockCompaniesRouter: FastifyPluginAsyncZod<
  MockCompaniesRouterOptions
> = async (fastify, { knodeId, seedConfig }) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        COMPANIES_MOCK_ESERVICE_ID,
        COMPANIES_MOCK_ESERVICE_VERSION_ID,
        COMPANIES_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { uidCompany } = req.params;
      const legalEntity = findLegalEntity(uidCompany);
      if (!legalEntity) {
        throw legalEntityNotFound(uidCompany);
      }

      logger.info(
        `Mock e-service /legal-entities/${uidCompany}/information returned the legal entity`,
      );
      res.status(200).send(legalEntity);
    },
    method: "GET",
    schema: {
      description:
        "Returns the registry information of a legal entity (company) identified by its uid_company (Cross-Border E-service 04, Bearer-protected).",
      operationId: "getCompanyInformation",
      params: z.strictObject({ uidCompany: API_CompanyUid }),
      response: {
        200: API_LegalEntity.meta({
          description: "Registry information for the requested legal entity",
        }),
        400: API_Problem.meta({ description: "Invalid uid_company" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description: "No legal entity found for the uid_company",
        }),
      },
      summary: "Get company information",
      tags: [apiTags.legalEntity],
    },
    url: "/legal-entities/:uidCompany/information",
  });

  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        COMPANIES_MOCK_ESERVICE_ID,
        COMPANIES_MOCK_ESERVICE_VERSION_ID,
        COMPANIES_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { uidCompany } = req.params;
      const { evidenceType } = req.query;
      const evidences = findEvidences(
        uidCompany,
        Date.now(),
        seedConfig,
        evidenceType,
      );
      if (!evidences) {
        throw legalEntityNotFound(uidCompany);
      }

      logger.info(
        `Mock e-service /legal-entities/${uidCompany}/evidences returned ${evidences.length} evidence(s)`,
      );
      res.status(200).send(evidences);
    },
    method: "GET",
    schema: {
      description:
        "Returns the evidences held about a legal entity (company), optionally filtered by evidence type (Cross-Border E-service 04, Bearer-protected).",
      operationId: "getEvidences",
      params: z.strictObject({ uidCompany: API_CompanyUid }),
      querystring: z.strictObject({
        evidenceType: API_EvidenceType.optional(),
      }),
      response: {
        200: z
          .array(API_Evidence)
          .meta({ description: "Evidences for the requested legal entity" }),
        400: API_Problem.meta({ description: "Invalid uid_company" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description: "No legal entity found for the uid_company",
        }),
      },
      summary: "Get evidences",
      tags: [apiTags.legalEntity],
    },
    url: "/legal-entities/:uidCompany/evidences",
  });
};
