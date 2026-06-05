import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import type { SignupService } from "../services/signupService.ts";

import { API_ConfirmOnboardingRequestBody } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";

interface SignupRouterOptions {
  signupService: SignupService;
}

export const signupRouter: FastifyPluginAsyncZod<SignupRouterOptions> = async (
  fastify,
  { signupService },
) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-signup-session" },
      ]);

      await signupService.confirmOnboarding(req.body, ctx);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      body: API_ConfirmOnboardingRequestBody,
      description: "Confirm onboarding for the caller user",
      operationId: "confirmOnboarding",
      response: {
        204: z
          .undefined()
          .meta({ description: "Onboarding confirmed successfully" }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.signup],
    },
    url: "/onboarding/confirm",
  });
};
