import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type KnodeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { addQualification } from "../data/students.ts";
import {
  API_Qualification,
  API_QualificationAck,
  API_StudentUid,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { studentNotFound } from "../models/errors.ts";
import {
  POC_UC01_SET_QUALIFICATION_MOCK_ESERVICE_ID,
  POC_UC01_SET_QUALIFICATION_MOCK_ESERVICE_VERSION_ID,
  POC_UC01_SET_QUALIFICATION_MOCK_PRODUCER_ID,
} from "../pocUc01/mockup.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

interface MockSetQualificationRouterOptions {
  knodeId: KnodeId;
}

export const mockPocUc01SetQualificationRouter: FastifyPluginAsyncZod<
  MockSetQualificationRouterOptions
> = async (fastify, { knodeId }) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);

      assertTokenClaimsAreValidForEservice(
        POC_UC01_SET_QUALIFICATION_MOCK_ESERVICE_ID,
        POC_UC01_SET_QUALIFICATION_MOCK_ESERVICE_VERSION_ID,
        POC_UC01_SET_QUALIFICATION_MOCK_PRODUCER_ID,
        knodeId,
      );

      const { uidStudent } = req.params;
      const registered = addQualification(uidStudent, req.body);
      if (!registered) {
        throw studentNotFound(uidStudent);
      }

      logger.info(
        `Mock e-service registered a new qualification for student ${uidStudent}`,
      );
      res.status(200).send({ acknowledged: true, uidStudent });
    },
    method: "POST",
    schema: {
      body: API_Qualification.meta({
        description: "Qualification to register for the student",
      }),
      description:
        "Registers a new qualification for a student identified by uidStudent and returns an acknowledgement (Bearer-protected).",
      operationId: "setQualification",
      params: z.strictObject({ uidStudent: API_StudentUid }),
      response: {
        200: API_QualificationAck.meta({
          description: "The qualification was accepted by the registry",
        }),
        400: API_Problem.meta({
          description: "Invalid uidStudent or qualification payload",
        }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({
          description: "No student found for the uidStudent",
        }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Set qualification",
      tags: [apiTags.pocUc01SetQualification],
    },
    url: "/students/:uidStudent/qualifications",
  });
};
