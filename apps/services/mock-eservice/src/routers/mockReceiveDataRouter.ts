import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  type EserviceId,
  type EserviceVersionId,
  generateId,
  type KnodeId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { findLegalEntity } from "../data/legalEntities.ts";
import { API_Ack, API_SendDigitalContactRequest } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { legalEntityNotFound } from "../models/errors.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

// Identity of this mock e-service. Hardcoded on purpose.
// (kept in sync with scripts/seed/sql/<tenant>/mock-receive-data-eservice.sql).
const EXPECTED_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "b1d4a9c6-7e29-4d61-9c12-1a4f8b3e5c08",
);
const EXPECTED_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "c2e5b1d4-8f3a-4e72-9d28-2b5c9c4f6d19",
);
const EXPECTED_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);

interface MockReceiveDataRouterOptions {
  knodeId: KnodeId;
}

export const mockReceiveDataRouter: FastifyPluginAsyncZod<
  MockReceiveDataRouterOptions
> = async (fastify, { knodeId }) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        EXPECTED_ESERVICE_ID,
        EXPECTED_ESERVICE_VERSION_ID,
        EXPECTED_PRODUCER_ID,
        knodeId,
      );

      const { contactPoint, legalEntity } = req.body;

      // The legal entity submitted by the Consumer must exist in the
      // Producer's registry — otherwise the submission has nothing to
      // attach the digital contact point to. We reuse the same lookup
      // (and 404 error) that the read-side companies e-service uses.
      const uidCompany = legalEntity.legalIdentifier.notation;
      if (!findLegalEntity(uidCompany)) {
        throw legalEntityNotFound(uidCompany);
      }

      // This is a Receive-data mock: the Producer does not persist anything.
      // It just acknowledges receipt with a correlation id and a timestamp.
      const ack = {
        correlationId: generateId(),
        receivedAt: new Date().toISOString(),
      } as const;

      logger.info(
        { contactPoint, uidCompany },
        `Mock e-service /digital-contacts received submission, ack ${ack.correlationId}`,
      );
      res.status(202).send(ack);
    },
    method: "POST",
    schema: {
      body: API_SendDigitalContactRequest,
      description:
        "Receives the digital contact point of a legal entity from the Consumer and returns an acknowledgment (Cross-Border E-service 04, Bearer-protected, Receive-data mode). Returns 404 if the legal entity is not known to the Producer.",
      operationId: "sendDigitalContact",
      response: {
        202: API_Ack.meta({
          description: "Submission accepted by the Producer",
        }),
        400: API_Problem.meta({ description: "Invalid submission body" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description: "No legal entity found for the submitted uid_company",
        }),
      },
      summary: "Send digital contact",
      tags: [apiTags.companyDigitalDomicile],
    },
    url: "/digital-contacts",
  });
};
