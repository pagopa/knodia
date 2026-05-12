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

import { findDigitalContact } from "../data/naturalPersons.ts";
import { API_DigitalContact, API_Notation } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { naturalPersonNotFound } from "../models/errors.ts";
import { MockEserviceHeaders } from "../models/headers.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

// Identity of this mock e-service. Hardcoded on purpose.
// (kept in sync with scripts/seed/sql/<tenant>/mock-dpop-eservice.sql).
const EXPECTED_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "905c4569-95db-4670-a146-8239fcb3f41a",
);
const EXPECTED_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "a50299cc-f381-4089-8684-a63b2497b690",
);
const EXPECTED_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);

interface MockDpopRouterOptions {
  knodeId: KnodeId;
}

export const mockDpopRouter: FastifyPluginAsyncZod<
  MockDpopRouterOptions
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

      const { notation } = req.params;
      const result = findDigitalContact(notation);
      if (!result) {
        throw naturalPersonNotFound(notation);
      }

      logger.info(
        `Mock e-service /natural-persons/${notation}/digital-contact returned digital contact`,
      );
      res.status(200).send(result);
    },
    method: "GET",
    schema: {
      description:
        "Returns the digital contact of a natural person identified by Codice Fiscale (Cross-Border E-Service 02, DPoP-protected).",
      headers: MockEserviceHeaders,
      operationId: "getDigitalContact",
      params: z.strictObject({ notation: API_Notation }),
      response: {
        200: API_DigitalContact.meta({
          description: "Digital contact for the requested natural person",
        }),
        400: API_Problem.meta({ description: "Invalid Codice Fiscale" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description: "No natural person found for the given Codice Fiscale",
        }),
      },
      summary: "Get digital contact",
      tags: [apiTags.digitalContact],
    },
    url: "/natural-persons/:notation/digital-contact",
  });
};
