import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type KnodeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { findEvidences } from "../data/legalEntities.ts";
import {
  API_CompanyUid,
  API_CompanyUidPathParam,
  API_Evidence,
  API_EvidenceType,
  API_LegalEntity,
  API_Pseudonymization,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { legalEntityNotFound } from "../models/errors.ts";
import {
  POC_UC02_COMPANIES_MOCK_ESERVICE_ID,
  POC_UC02_COMPANIES_MOCK_ESERVICE_VERSION_ID,
  POC_UC02_COMPANIES_MOCK_PRODUCER_ID,
} from "../pocUc02Companies/mockup.ts";
import { retrieveLegalEntity } from "../utils/retrievalUtils.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

interface MockCompaniesRouterOptions {
  knodeId: KnodeId;
}

// Static seed: unlike the signal-hub mock, this demo's object_id need not rotate,
// so publish and recover stay consistent without a period constraint.
const PSEUDONYMIZATION_SEED = "0123456789abcdef";

export const mockPocUc02CompaniesRouter: FastifyPluginAsyncZod<
  MockCompaniesRouterOptions
> = async (fastify, { knodeId }) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);
      assertTokenClaimsAreValidForEservice(
        POC_UC02_COMPANIES_MOCK_ESERVICE_ID,
        POC_UC02_COMPANIES_MOCK_ESERVICE_VERSION_ID,
        POC_UC02_COMPANIES_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { uidCompany } = req.params;
      const legalEntity = retrieveLegalEntity(uidCompany);

      logger.info(
        `Mock e-service /legal-entities/${uidCompany}/information returned the legal entity`,
      );
      res.status(200).send(legalEntity);
    },
    method: "GET",
    schema: {
      description:
        "Returns the registry information of a legal entity (company) identified by its uid_company (Bearer-protected).",
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get company information",
      tags: [apiTags.pocUc02Companies],
    },
    url: "/legal-entities/:uidCompany/information",
  });

  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);
      assertTokenClaimsAreValidForEservice(
        POC_UC02_COMPANIES_MOCK_ESERVICE_ID,
        POC_UC02_COMPANIES_MOCK_ESERVICE_VERSION_ID,
        POC_UC02_COMPANIES_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { uidCompany } = req.params;
      const { evidenceType } = req.query;
      const evidences = findEvidences(uidCompany, evidenceType);
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
        "Returns the evidences held about a legal entity (company), optionally filtered by evidence type (Bearer-protected).",
      operationId: "getEvidences",
      params: API_CompanyUidPathParam,
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
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get evidences",
      tags: [apiTags.pocUc02Companies],
    },
    url: "/legal-entities/:uidCompany/evidences",
  });

  fastify.route({
    handler: async (_req, res) => {
      const { logger } = getContextValues(requestContext);
      assertTokenClaimsAreValidForEservice(
        POC_UC02_COMPANIES_MOCK_ESERVICE_ID,
        POC_UC02_COMPANIES_MOCK_ESERVICE_VERSION_ID,
        POC_UC02_COMPANIES_MOCK_PRODUCER_ID,
        knodeId,
      );

      logger.info(
        "Mock e-service /legal-entities/pseudonymization returned the seed",
      );
      res
        .status(200)
        .send({ cryptoHashFunction: "sha256", seed: PSEUDONYMIZATION_SEED });
    },
    method: "GET",
    schema: {
      description:
        "Returns the pseudonymization parameters used by the Producer to publish Signal Hub signals for the evidences managed by this e-service.",
      operationId: "getCompaniesPseudonymization",
      response: {
        200: API_Pseudonymization.meta({
          description: "Pseudonymization parameters for this e-service",
        }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get evidence pseudonymization",
      tags: [apiTags.pocUc02Companies],
    },
    url: "/legal-entities/pseudonymization",
  });
};
