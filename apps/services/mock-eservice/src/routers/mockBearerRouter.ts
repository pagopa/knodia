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

import { findPersonalInformation } from "../data/naturalPersons.ts";
import { API_Notation, API_PersonalInformation } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { naturalPersonNotFound } from "../models/errors.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

// Identity of this mock e-service. Hardcoded on purpose.
// (kept in sync with scripts/seed/sql/<tenant>/mock-bearer-eservice.sql).
const EXPECTED_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "e7f5837e-75f4-431d-9465-73366d27bef2",
);
const EXPECTED_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "29721f0d-e36e-4157-bcdc-9629ace0f85b",
);
const EXPECTED_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);

interface MockRouterOptions {
  knodeId: KnodeId;
}

export const mockBearerRouter: FastifyPluginAsyncZod<
  MockRouterOptions
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
      const result = findPersonalInformation(notation);
      if (!result) {
        throw naturalPersonNotFound(notation);
      }

      logger.info(
        `Mock e-service /natural-persons/${notation} returned personal information`,
      );
      res.status(200).send(result);
    },
    method: "GET",
    schema: {
      description:
        "Returns the date of birth of a natural person identified by Codice Fiscale (Cross-Border E-Service 01, Bearer-protected).",
      operationId: "getPersonalInformation",
      params: z.strictObject({ notation: API_Notation }),
      response: {
        200: API_PersonalInformation.meta({
          description: "Personal information for the requested natural person",
        }),
        400: API_Problem.meta({ description: "Invalid Codice Fiscale" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description: "No natural person found for the given Codice Fiscale",
        }),
      },
      summary: "Get personal information",
      tags: [apiTags.personalInformation],
    },
    url: "/natural-persons/:notation",
  });
};
