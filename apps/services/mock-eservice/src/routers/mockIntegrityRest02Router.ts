import type { KnodeId } from "@knodia/common-models/ids";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import {
  INTEGRITY_REST_02_MOCK_ESERVICE_ID,
  INTEGRITY_REST_02_MOCK_ESERVICE_VERSION_ID,
  INTEGRITY_REST_02_MOCK_PRODUCER_ID,
} from "../integrityRest02/mockup.ts";
import {
  API_CompanyAddress,
  API_CompanyUidPathParam,
  API_IntegrityRest02Headers,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import {
  retrieveLegalEntity,
  retrieveLegalEntityAddress,
} from "../utils/retrievalUtils.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

interface MockIntegrityRest02RouterOptions {
  knodeId: KnodeId;
}

export const mockIntegrityRest02Router: FastifyPluginAsyncZod<
  MockIntegrityRest02RouterOptions
> = async (fastify, { knodeId }) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        INTEGRITY_REST_02_MOCK_ESERVICE_ID,
        INTEGRITY_REST_02_MOCK_ESERVICE_VERSION_ID,
        INTEGRITY_REST_02_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { uidCompany } = req.params;
      const legalEntity = retrieveLegalEntity(uidCompany);
      const legalEntityAddress = retrieveLegalEntityAddress(uidCompany);

      logger.info(
        `Mock e-service /legal-entities/${uidCompany}/address returned company address`,
      );
      return res.status(200).send({
        address: legalEntityAddress,
        legalEntity,
      });
    },
    method: "GET",
    schema: {
      description:
        "Returns the address of a company identified by its UID (Cross-Border E-service 06, Bearer-protected).",
      operationId: "getCompanyAddress",
      params: API_CompanyUidPathParam,
      response: {
        200: API_CompanyAddress,
        400: API_Problem.meta({ description: "Invalid uid_company" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description:
            "No legal entity found for the uid_company, or no address is available for it",
        }),
      },
      responseHeaders: API_IntegrityRest02Headers,
      summary: "Get company address",
      tags: [apiTags.companyAddress],
    },
    url: "/legal-entities/:uidCompany/address",
  });
};
