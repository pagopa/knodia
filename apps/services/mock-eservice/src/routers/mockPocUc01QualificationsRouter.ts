import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type KnodeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { findQualifications } from "../data/students.ts";
import {
  API_ISCEDFCode,
  API_Qualification,
  API_StudentUid,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { studentNotFound } from "../models/errors.ts";
import {
  POC_UC01_QUALIFICATIONS_MOCK_ESERVICE_ID,
  POC_UC01_QUALIFICATIONS_MOCK_ESERVICE_VERSION_ID,
  POC_UC01_QUALIFICATIONS_MOCK_PRODUCER_ID,
} from "../pocUc01Qualifications/mockup.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

interface MockQualificationsRouterOptions {
  knodeId: KnodeId;
}

export const mockPocUc01QualificationsRouter: FastifyPluginAsyncZod<
  MockQualificationsRouterOptions
> = async (fastify, { knodeId }) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        POC_UC01_QUALIFICATIONS_MOCK_ESERVICE_ID,
        POC_UC01_QUALIFICATIONS_MOCK_ESERVICE_VERSION_ID,
        POC_UC01_QUALIFICATIONS_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { uidStudent } = req.params;
      const { iscedfCode } = req.query;
      const qualifications = findQualifications(uidStudent, iscedfCode);
      if (!qualifications) {
        throw studentNotFound(uidStudent);
      }

      logger.info(
        `Mock e-service /students/${uidStudent}/qualifications returned ${qualifications.length} qualification(s)`,
      );
      res.status(200).send(qualifications);
    },
    method: "GET",
    schema: {
      description:
        "Returns the qualifications held by a student identified by uidStudent, optionally filtered by ISCED-F field code (Bearer-protected).",
      operationId: "getQualifications",
      params: z.strictObject({ uidStudent: API_StudentUid }),
      querystring: z.strictObject({
        iscedfCode: API_ISCEDFCode.optional(),
      }),
      response: {
        200: z
          .array(API_Qualification)
          .meta({ description: "Qualifications for the requested student" }),
        400: API_Problem.meta({ description: "Invalid uidStudent" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description: "No student found for the uidStudent",
        }),
      },
      summary: "Get qualifications",
      tags: [apiTags.pocUc01Qualifications],
    },
    url: "/students/:uidStudent/qualifications",
  });
};
