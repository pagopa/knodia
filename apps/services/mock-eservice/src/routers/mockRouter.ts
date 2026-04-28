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
import {
  API_Problem,
  unauthorizedError,
} from "@knodia/fastify-zod-api-commons/models";

import { API_TestResponse } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";

// Identity of this mock e-service. Hardcoded on purpose — these ids are also
// hardcoded in docker/readmodel-seed/mock-eservice.sql. Keep the two in sync.
const EXPECTED_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "10000000-0000-4000-8000-000000000001",
);
const EXPECTED_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "10000000-0000-4000-8000-000000000002",
);
const EXPECTED_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);

interface MockRouterOptions {
  knodeId: KnodeId;
}

export const mockRouter: FastifyPluginAsyncZod<MockRouterOptions> = async (
  fastify,
  { knodeId },
) => {
  fastify.route({
    handler: async (_req, res) => {
      const { logger } = getContextValues(requestContext);
      const claims = requestContext.get("accessTokenClaims");
      if (!claims) {
        throw unauthorizedError("Missing access token claims");
      }

      const { eservice, producer } = claims;
      const mismatches: string[] = [];
      if (eservice.id !== EXPECTED_ESERVICE_ID) {
        mismatches.push(
          `eservice.id ${eservice.id} does not match ${EXPECTED_ESERVICE_ID}`,
        );
      }
      if (eservice.version !== EXPECTED_ESERVICE_VERSION_ID) {
        mismatches.push(
          `eservice.version ${eservice.version} does not match ${EXPECTED_ESERVICE_VERSION_ID}`,
        );
      }
      if (eservice.knode_id !== knodeId) {
        mismatches.push(
          `eservice.knode_id ${eservice.knode_id} does not match ${knodeId}`,
        );
      }
      if (producer.id !== EXPECTED_PRODUCER_ID) {
        mismatches.push(
          `producer.id ${producer.id} does not match ${EXPECTED_PRODUCER_ID}`,
        );
      }
      if (producer.knode_id !== knodeId) {
        mismatches.push(
          `producer.knode_id ${producer.knode_id} does not match ${knodeId}`,
        );
      }
      if (mismatches.length > 0) {
        throw unauthorizedError(
          `Access token does not target this e-service: ${mismatches.join("; ")}`,
        );
      }

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
      tags: [apiTags.mock],
    },
    url: "/test",
  });
};
