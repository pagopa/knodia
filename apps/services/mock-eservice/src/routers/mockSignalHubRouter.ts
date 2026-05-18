import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  type EserviceId,
  type EserviceVersionId,
  type KnodeId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { findResidence } from "../data/naturalPersons.ts";
import {
  API_Notation,
  API_Pseudonymization,
  API_Residence,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { naturalPersonNotFound } from "../models/errors.ts";
import { computePeriodId, getRotatedSeed } from "../utils/rotation.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

// Identity of this mock e-service. Hardcoded on purpose.
// (kept in sync with scripts/seed/sql/<tenant>/mock-signal-hub-eservice.sql).
const EXPECTED_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const EXPECTED_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "fa2a800a-5058-4859-b68a-bfbd3ee863c0",
);
const EXPECTED_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);

interface MockSignalHubRouterOptions {
  knodeId: KnodeId;
  seedAlgorithm: string;
  seedExpireSeconds: number;
  seedSaltLength: number;
  seedStartDateMs: number;
}

export const mockSignalHubRouter: FastifyPluginAsyncZod<
  MockSignalHubRouterOptions
> = async (
  fastify,
  {
    knodeId,
    seedAlgorithm,
    seedExpireSeconds,
    seedSaltLength,
    seedStartDateMs,
  },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        EXPECTED_ESERVICE_ID,
        EXPECTED_ESERVICE_VERSION_ID,
        EXPECTED_PRODUCER_ID,
        knodeId,
      );

      const { identifierNotation } = req.params;
      const periodId = computePeriodId(
        Date.now(),
        seedStartDateMs,
        seedExpireSeconds,
      );
      const result = findResidence(identifierNotation, periodId);
      if (!result) {
        throw naturalPersonNotFound(identifierNotation);
      }

      logger.info(
        `Mock e-service /natural-persons/${identifierNotation}/residence returned residence (periodId=${periodId})`,
      );
      res.status(200).send(result);
    },
    method: "GET",
    schema: {
      description:
        "Returns the residence of a natural person identified by Codice Fiscale (Cross-Border E-Service 03, Bearer-protected). The response for the rotating subset of fiscal codes cycles per periodId.",
      operationId: "getResidence",
      params: z.strictObject({ identifierNotation: API_Notation }),
      response: {
        200: API_Residence.meta({
          description: "Residence for the requested natural person",
        }),
        400: API_Problem.meta({ description: "Invalid Codice Fiscale" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description:
            "No natural person found, or the resource is in its DELETE phase for the current periodId",
        }),
      },
      summary: "Get residence",
      tags: [apiTags.residence],
    },
    url: "/natural-persons/:identifierNotation/residence",
  });

  fastify.route({
    handler: async (_req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        EXPECTED_ESERVICE_ID,
        EXPECTED_ESERVICE_VERSION_ID,
        EXPECTED_PRODUCER_ID,
        knodeId,
      );

      const periodId = computePeriodId(
        Date.now(),
        seedStartDateMs,
        seedExpireSeconds,
      );
      const seed = getRotatedSeed(EXPECTED_ESERVICE_ID, periodId, {
        algorithm: seedAlgorithm,
        saltLength: seedSaltLength,
      });

      logger.info(
        `Mock e-service /pseudonymization returned seed for periodId=${periodId}`,
      );
      res.status(200).send({ cryptoHashFunction: "sha256", seed });
    },
    method: "GET",
    schema: {
      description:
        "Returns the pseudonymization parameters (seed + crypto hash function) used by this producer to publish Signal Hub signals. The seed rotates per periodId.",
      operationId: "getPseudonymization",
      response: {
        200: API_Pseudonymization.meta({
          description:
            "Pseudonymization parameters for the current rotation period",
        }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      summary: "Get pseudonymization",
      tags: [apiTags.residence],
    },
    url: "/pseudonymization",
  });
};
