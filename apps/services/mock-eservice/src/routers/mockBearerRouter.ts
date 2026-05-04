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
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

// Identity of this mock e-service. Hardcoded on purpose.
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
    handler: async (_req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        EXPECTED_ESERVICE_ID,
        EXPECTED_ESERVICE_VERSION_ID,
        EXPECTED_PRODUCER_ID,
        knodeId,
      );

      logger.info("Mock e-service /test invoked with valid access token");
      res.status(200).send({ status: "ok" });
    },
    method: "GET",
    schema: {
      description:
        "Validates the incoming Bearer access token and returns a static success response",
      operationId: "test",
      response: {
        200: API_TestResponse.meta({ description: "Access token accepted" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      summary: "Mock e-service endpoint",
      tags: [apiTags.bearerTokenMock],
    },
    url: "/test",
  });
};
