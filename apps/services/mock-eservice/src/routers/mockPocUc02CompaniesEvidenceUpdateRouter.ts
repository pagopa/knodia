import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { JWTVerifyGetKey } from "jose";

import { type KnodeId } from "@knodia/common-models/ids";
import { parseAuthHeaderToken } from "@knodia/fastify-zod-api-commons/auth";
import {
  API_Problem,
  unauthorizedError,
} from "@knodia/fastify-zod-api-commons/models";
import {
  enforceRateLimit,
  type RateLimiter,
} from "@knodia/fastify-zod-api-commons/rate-limit";
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
  rateLimiter: RateLimiter;
}

// Demo-only (POC UC02 Phase 4): lets the producer mark a company's evidence as
// changed so the recover step sees an update. Gated by the producer's Knode API
// token (the one it uses to publish the signal). Registered only on the runtime
// app, never on the spec-generation apps, so it stays out of the published spec.
export const mockPocUc02CompaniesEvidenceUpdateRouter: FastifyPluginAsyncZod<
  MockCompaniesEvidenceUpdateRouterOptions
> = async (fastify, { expectedIssuer, jwksResolvers, knodeId, rateLimiter }) => {
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

      // This route sits outside the bearer/DPoP rate-limit scope (it self-auths
      // a Knode API token, not a consumer access token), so enforce inline —
      // keyed on the producer org, mirroring authorization-server's approach.
      await enforceRateLimit(rateLimiter, claims.organization.id, req.log);

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
        429: API_Problem,
      },
    },
    url: "/legal-entities/:uidCompany/evidence-update",
  });
};
