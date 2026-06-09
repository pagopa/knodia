import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { JWTVerifyGetKey } from "jose";

import { type KnodeId } from "@knodia/common-models/ids";
import { parseAuthHeaderToken } from "@knodia/fastify-zod-api-commons/auth";
import {
  API_Problem,
  unauthorizedError,
} from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import {
  bumpEvidenceRevision,
  findLegalEntity,
} from "../data/legalEntities.ts";
import { API_CompanyUid } from "../models/api.ts";
import { legalEntityNotFound } from "../models/errors.ts";
import { POC_UC02_COMPANIES_MOCK_PRODUCER_ID } from "../pocUc02Companies/mockup.ts";
import { verifyKnodeApiAccessToken } from "../utils/validators.ts";

interface MockCompaniesEvidenceUpdateRouterOptions {
  expectedIssuer: string;
  jwksResolvers: JWTVerifyGetKey[];
  knodeId: KnodeId;
}

// POC UC02 Phase 4, producer side: lets the producer mark a company's evidence
// as changed so the Signal Hub recover step sees an updated evidence.
//
// It is gated by the producer's Knode API token — the very same token the
// producer uses to publish the evidence-change signal to the Signal Hub — so
// only the producer that owns this e-service can mutate the served data,
// mirroring the real trust boundary instead of inventing a separate credential.
//
// It is registered only on the runtime app (buildApp), never on the
// spec-generation apps: changing the served data is demo plumbing, not a real
// e-service operation, so it must not appear in any published OpenAPI spec.
export const mockPocUc02CompaniesEvidenceUpdateRouter: FastifyPluginAsyncZod<
  MockCompaniesEvidenceUpdateRouterOptions
> = async (fastify, { expectedIssuer, jwksResolvers, knodeId }) => {
  fastify.route({
    handler: async (req, res) => {
      const token = parseAuthHeaderToken(req.headers.authorization);
      const claims = await verifyKnodeApiAccessToken(token, {
        expectedIssuer,
        jwksResolvers,
      });
      if (
        claims.organization.id !== POC_UC02_COMPANIES_MOCK_PRODUCER_ID ||
        claims.organization.knode_id !== knodeId
      ) {
        throw unauthorizedError(
          "Only the producer of this e-service can update its evidence",
        );
      }

      const { uidCompany } = req.params;
      if (!findLegalEntity(uidCompany)) {
        throw legalEntityNotFound(uidCompany);
      }

      const evidenceRevision = bumpEvidenceRevision(uidCompany);
      req.log.info(
        `Mock e-service evidence-update bumped ${uidCompany} to revision ${evidenceRevision}`,
      );
      res.status(200).send({ evidenceRevision, uidCompany });
    },
    method: "POST",
    schema: {
      params: z.strictObject({ uidCompany: API_CompanyUid }),
      response: {
        200: z.strictObject({
          evidenceRevision: z.number(),
          uidCompany: API_CompanyUid,
        }),
        400: API_Problem,
        401: API_Problem,
        404: API_Problem,
      },
    },
    url: "/legal-entities/:uidCompany/evidence-update",
  });
};
