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

import { API_TestResponse } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { MockEserviceHeaders } from "../models/headers.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

// Identity of this mock e-service. Hardcoded on purpose — these ids are also
// hardcoded in docker/readmodel-seed/mock-dpop-eservice.sql. Keep the two in sync.
const EXPECTED_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "10000000-0000-4000-8000-000000000004",
);
const EXPECTED_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "10000000-0000-4000-8000-000000000005",
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
    handler: async (_req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        EXPECTED_ESERVICE_ID,
        EXPECTED_ESERVICE_VERSION_ID,
        EXPECTED_PRODUCER_ID,
        knodeId,
      );

      logger.info(
        "Mock e-service /testDpop invoked with valid DPoP access token",
      );
      res.status(200).send({ status: "ok" });
    },
    method: "GET",
    schema: {
      description:
        "Validates the incoming DPoP access token and returns a static success response",
      headers: MockEserviceHeaders,
      operationId: "testDpop",
      response: {
        200: API_TestResponse.meta({ description: "Access token accepted" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      summary: "Mock e-service DPoP endpoint",
      tags: [apiTags.mock],
    },
    url: "/testDpop",
  });
};
