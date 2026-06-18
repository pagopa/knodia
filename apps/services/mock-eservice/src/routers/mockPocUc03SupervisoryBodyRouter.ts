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
  // Relay base URL of each SERC, resolved per environment (see config.ts). The
  // relay runs in the producer's own infra, not on the Knode, so the lookup is
  // the only way for a consumer to discover it.
  relayBaseUrlByErds: Record<API_ErdsIdentifier, string>;
}

export const mockPocUc03SupervisoryBodyRouter: FastifyPluginAsyncZod<
  MockSupervisoryBodyRouterOptions
> = async (fastify, { knodeId, relayBaseUrlByErds }) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);
      assertTokenClaimsAreValidForEservice(
        POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_ID,
        POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_VERSION_ID,
        POC_UC03_SUPERVISORY_BODY_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { identifier } = req.query;
      const erdsIdentifier = lookupErds(identifier);
      if (!erdsIdentifier) {
        throw erdsRecipientNotFound(identifier);
      }

      logger.info(
        `Mock e-service lookupERDS(${identifier}) -> ${erdsIdentifier}`,
      );
      res.status(200).send({ erdsIdentifier });
    },
    method: "GET",
    schema: {
      description:
        "Resolves the SERC (erdsIdentifier) that serves a recipient identified by the given notation (lookupERDS, Bearer-protected).",
      operationId: "lookupERDS",
      querystring: z.strictObject({
        identifier: z.string().min(1).meta({
          description: "Recipient identifier notation",
          example: "01229430085",
        }),
      }),
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

      const metadata = getErdsMetadata(parsed.data, relayBaseUrlByErds);
      logger.info(
        `Mock e-service getERDSMetadata(${erdsIdentifier}) -> ${metadata.domainName}`,
      );
      res.status(200).send(metadata);
    },
    method: "GET",
    schema: {
      description:
        "Returns the metadata of a SERC — its relay base URL and the knode/e-service that publish it (getERDSMetadata, Bearer-protected).",
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
