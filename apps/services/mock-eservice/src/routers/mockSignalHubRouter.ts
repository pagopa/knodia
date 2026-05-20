import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type KnodeId } from "@knodia/common-models/ids";
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
import {
  SIGNAL_HUB_MOCK_ESERVICE_ID,
  SIGNAL_HUB_MOCK_ESERVICE_VERSION_ID,
  SIGNAL_HUB_MOCK_PRODUCER_ID,
} from "../signalHub/mockup.ts";
import {
  getRotatedSeed,
  type SignalHubSeedConfig,
} from "../signalHub/rotation.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

interface MockSignalHubRouterOptions {
  knodeId: KnodeId;
  seedConfig: SignalHubSeedConfig;
}

export const mockSignalHubRouter: FastifyPluginAsyncZod<
  MockSignalHubRouterOptions
> = async (fastify, { knodeId, seedConfig }) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        SIGNAL_HUB_MOCK_ESERVICE_ID,
        SIGNAL_HUB_MOCK_ESERVICE_VERSION_ID,
        SIGNAL_HUB_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { identifierNotation } = req.params;
      const result = findResidence(identifierNotation, Date.now(), seedConfig);
      if (!result) {
        throw naturalPersonNotFound(identifierNotation);
      }

      logger.info(
        `Mock e-service /natural-persons/${identifierNotation}/residence returned residence`,
      );
      res.status(200).send(result);
    },
    method: "GET",
    schema: {
      description:
        "Returns the residence of a natural person identified by Codice Fiscale (Cross-Border E-Service 03, Bearer-protected).",
      operationId: "getResidence",
      params: z.strictObject({ identifierNotation: API_Notation }),
      response: {
        200: API_Residence.meta({
          description: "Residence for the requested natural person",
        }),
        400: API_Problem.meta({ description: "Invalid Codice Fiscale" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description: "No natural person found for the given Codice Fiscale",
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
        SIGNAL_HUB_MOCK_ESERVICE_ID,
        SIGNAL_HUB_MOCK_ESERVICE_VERSION_ID,
        SIGNAL_HUB_MOCK_PRODUCER_ID,
        knodeId,
      );

      const seed = getRotatedSeed(
        SIGNAL_HUB_MOCK_ESERVICE_ID,
        Date.now(),
        seedConfig,
      );

      logger.info("Mock e-service /pseudonymization returned current seed");
      res.status(200).send({ cryptoHashFunction: "sha256", seed });
    },
    method: "GET",
    schema: {
      description:
        "Returns the pseudonymization parameters used by the Producer to publish Signal Hub signals for the residence addresses managed by this e-service.",
      operationId: "getPseudonymization",
      response: {
        200: API_Pseudonymization.meta({
          description: "Pseudonymization parameters for this e-service",
        }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      summary: "Get pseudonymization",
      tags: [apiTags.residence],
    },
    url: "/pseudonymization",
  });
};
