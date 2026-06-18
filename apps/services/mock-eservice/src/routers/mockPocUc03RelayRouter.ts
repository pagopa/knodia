import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { generateId, type KnodeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { API_ErdDispatch, API_RelayAck } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { POC_UC03_RELAY_IDENTITY_BY_KNODE } from "../pocUc03Erds/mockup.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

interface MockRelayRouterOptions {
  knodeId: KnodeId;
}

export const mockPocUc03RelayRouter: FastifyPluginAsyncZod<
  MockRelayRouterOptions
> = async (fastify, { knodeId }) => {
  // Both knodes run the same relay code; the e-service it serves (and therefore
  // the token claims it accepts) is the one published on this knode.
  const relay = POC_UC03_RELAY_IDENTITY_BY_KNODE[knodeId];

  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        relay.eserviceId,
        relay.eserviceVersionId,
        relay.producerId,
        knodeId,
      );

      const { messageIdentifier, messageType } = req.body.relayMetadata;

      // Receive-data mock: the SERC does not persist anything. It accepts the
      // dispatch and acknowledges receipt; consignment/handover are narrated.
      const ack = {
        correlationId: generateId(),
        messageIdentifier,
        receivedAt: new Date().toISOString(),
      };

      logger.info(
        `Mock e-service /relay accepted a ${messageType} dispatch ${messageIdentifier.uuid}, ack ${ack.correlationId}`,
      );
      res.status(200).send(ack);
    },
    method: "POST",
    schema: {
      body: API_ErdDispatch,
      description:
        "Receives an ERD dispatch (the sender's message or the delivery evidences) from another SERC and acknowledges it (ETSI EN 319 522-2 relay, Bearer-protected, Receive-data mode).",
      operationId: "relay",
      response: {
        200: API_RelayAck.meta({
          description: "Dispatch accepted by the SERC",
        }),
        400: API_Problem.meta({ description: "Invalid erd_dispatch body" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      summary: "Relay",
      tags: [apiTags.pocUc03Relay],
    },
    url: "/relay",
  });
};
