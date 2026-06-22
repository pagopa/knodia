import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import type { SignupService } from "../services/signupService.ts";

import {
  API_ChangeEmailRequestBody,
  API_ConfirmOnboardingRequestBody,
  API_CurrentSignupUser,
  API_SuspendUserRequestBody,
} from "../models/api.ts";
import {
  fromAPI_toSuspensionReason,
  toAPI_CurrentSignupUser,
} from "../models/apiConverter.ts";
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
      const ctxValues = getContextValues(requestContext);
      const ctx = validateAuthorization(ctxValues, [
        { tokenType: "ui-signup-session" },
      ]);

      ctxValues.logger.info("Confirming onboarding for current signup user");

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
    url: "/user/confirmOnboarding",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctxValues = getContextValues(requestContext);
      const ctx = validateAuthorization(ctxValues, [
        { tokenType: "ui-signup-session" },
      ]);

      ctxValues.logger.info("Requesting email change for current signup user");

      await signupService.changeEmail(req.body, ctx);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      body: API_ChangeEmailRequestBody,
      description: "Request email change for the caller user",
      operationId: "changeEmail",
      response: {
        204: z.undefined().meta({
          description: "Email change requested successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.signup],
    },
    url: "/user/changeEmail",
  });

  fastify.route({
    handler: async (_req, res) => {
      const ctxValues = getContextValues(requestContext);
      const ctx = validateAuthorization(ctxValues, [
        { tokenType: "ui-signup-session" },
      ]);

      ctxValues.logger.info("Requesting deletion of current signup user");

      await signupService.deleteCurrentSignupUser(ctx);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Request the deletion of the caller signup user",
      operationId: "deleteUser",
      response: {
        204: z
          .undefined()
          .meta({ description: "User deletion requested successfully" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.signup],
    },
    url: "/user/delete",
  });

  fastify.route({
    handler: async (_req, res) => {
      const ctxValues = getContextValues(requestContext);
      const ctx = validateAuthorization(ctxValues, [
        { tokenType: "ui-signup-session" },
      ]);

      ctxValues.logger.info("Getting current signup user");

      const currentSignupUser = await signupService.getCurrentSignupUser(ctx);

      res.status(200).send(toAPI_CurrentSignupUser(currentSignupUser));
    },
    method: "GET",
    schema: {
      description: "Get current signup user onboarding status",
      operationId: "getCurrentSignupUser",
      response: {
        200: API_CurrentSignupUser.meta({
          description: "Current signup user onboarding status",
        }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.signup],
    },
    url: "/user/me",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-signup-session" },
      ]);

      await signupService.suspendUser(
        {
          suspensionReason: fromAPI_toSuspensionReason(
            req.body.suspensionReason,
          ),
        },
        ctx,
      );

      res.status(204).send();
    },
    method: "POST",
    schema: {
      body: API_SuspendUserRequestBody,
      description: "Request suspension for the caller user",
      operationId: "suspendUser",
      response: {
        204: z.undefined().meta({
          description: "User suspension requested successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.signup],
    },
    url: "/user/suspend",
  });
};
