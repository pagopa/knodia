import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type KnodeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { getErdsMetadata, lookupErds } from "../data/erds.ts";
import {
  API_ErdsIdentifier,
  API_ErdsLookupResult,
  API_ErdsMetadata,
  API_ErdsRecipientIdentifier,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { erdsNotFound, erdsRecipientNotFound } from "../models/errors.ts";
import {
  POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_ID,
  POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_VERSION_ID,
  POC_UC03_SUPERVISORY_BODY_MOCK_PRODUCER_ID,
} from "../pocUc03/mockup.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

interface MockSupervisoryBodyRouterOptions {
  knodeId: KnodeId;
}

export const mockPocUc03SupervisoryBodyRouter: FastifyPluginAsyncZod<
  MockSupervisoryBodyRouterOptions
> = async (fastify, { knodeId }) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);
      assertTokenClaimsAreValidForEservice(
        POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_ID,
        POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_VERSION_ID,
        POC_UC03_SUPERVISORY_BODY_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { notation, schemeURI } = req.query;
      const erdsIdentifier = lookupErds({ notation, schemeURI });
      if (!erdsIdentifier) {
        throw erdsRecipientNotFound(notation);
      }

      logger.info(
        `Mock e-service lookupERDS(${notation}) -> ${erdsIdentifier}`,
      );
      res.status(200).send({ erdsIdentifier });
    },
    method: "GET",
    schema: {
      description:
        "Resolves the SERC (erdsIdentifier) that serves a recipient identified by the given IDENTIFIER (lookupERDS, Bearer-protected).",
      operationId: "lookupERDS",
      querystring: API_ErdsRecipientIdentifier,
      response: {
        200: API_ErdsLookupResult.meta({
          description: "The SERC that serves the recipient",
        }),
        400: API_Problem.meta({ description: "Missing or invalid identifier" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description: "No SERC serves the given recipient",
        }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Lookup ERDS",
      tags: [apiTags.pocUc03SupervisoryBody],
    },
    url: "/erds",
  });

  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);
      assertTokenClaimsAreValidForEservice(
        POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_ID,
        POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_VERSION_ID,
        POC_UC03_SUPERVISORY_BODY_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { erdsIdentifier } = req.params;
      const parsed = API_ErdsIdentifier.safeParse(erdsIdentifier);
      if (!parsed.success) {
        throw erdsNotFound(erdsIdentifier);
      }

      const metadata = getErdsMetadata(parsed.data);
      logger.info(
        `Mock e-service getERDSMetadata(${erdsIdentifier}) -> knode ${metadata.knodeId}`,
      );
      res.status(200).send(metadata);
    },
    method: "GET",
    schema: {
      description:
        "Returns the metadata of a SERC — its domain name and the knode/e-service that publish its relay (getERDSMetadata, Bearer-protected).",
      operationId: "getERDSMetadata",
      params: z.strictObject({
        erdsIdentifier: z
          .string()
          .min(1)
          .meta({ description: "SERC identifier", example: "systemSERCOrion" }),
      }),
      response: {
        200: API_ErdsMetadata.meta({ description: "Metadata of the SERC" }),
        400: API_Problem.meta({
          description: "Missing or invalid erdsIdentifier",
        }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description: "No SERC found for the identifier",
        }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get ERDS metadata",
      tags: [apiTags.pocUc03SupervisoryBody],
    },
    url: "/erds/:erdsIdentifier/metadata",
  });
};
