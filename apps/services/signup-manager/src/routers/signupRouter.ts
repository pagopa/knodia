import type { SerializeOptions } from "@fastify/cookie";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { generateId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import type { SignupService } from "../services/signupService.ts";

import {
  API_ConfirmOnboardingRequestBody,
  API_OIDCCallbackQuery,
  API_OIDCSessionCookie,
  API_SessionResponse,
  OIDC_SESSION_COOKIE_NAME,
  OidcSessionCookieData,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";

interface SignupRouterOptions {
  signupService: SignupService;
}

export const signupRouter: FastifyPluginAsyncZod<SignupRouterOptions> = async (
  fastify,
  { signupService },
) => {
  fastify.route({
    handler: async (_req, res) => {
      const nonce = generateId();
      const state = generateId();

      const { loginUrl } = signupService.startOIDCSession({ nonce, state });
      oidcSessionCookie.set(res, { nonce, state });

      res.status(302).redirect(loginUrl);
    },
    method: "GET",
    schema: {
      description: "Initiate OIDC session",
      operationId: "startOIDCSession",
      response: {
        302: z.undefined().meta({
          description: "Redirected to One Identity's login page",
        }),
      },
      security: [],
      tags: [apiTags.signup],
    },
    url: "/auth/oidc/start",
  });

  fastify.route({
    handler: async (req, res) => {
      const oidcSession = oidcSessionCookie.get(req);
      const { uiSignupSessionToken } = await signupService.exchangeOIDCCode({
        code: req.query.code,
        oidcSession,
        state: req.query.state,
      });

      oidcSessionCookie.clear(res);
      res.status(200).send({ uiSignupSessionToken });
    },
    method: "GET",
    schema: {
      cookies: API_OIDCSessionCookie,
      description:
        "Handle OIDC callback and exchange authorization code for session token",
      operationId: "exchangeOIDCCode",
      querystring: API_OIDCCallbackQuery,
      response: {
        200: API_SessionResponse.meta({
          description:
            "OIDC login successful, signup UI session token returned",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      security: [],
      tags: [apiTags.signup],
    },
    url: "/auth/oidc/token",
  });
};

export const protectedSignupRouter: FastifyPluginAsyncZod<
  SignupRouterOptions
> = async (fastify, { signupService }) => {
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

const OIDC_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "strict",
  secure: true,
} as const satisfies SerializeOptions;

const oidcSessionCookie = {
  clear: (res: FastifyReply) =>
    void res.clearCookie(OIDC_SESSION_COOKIE_NAME, OIDC_SESSION_COOKIE_OPTIONS),
  get: (req: FastifyRequest) => {
    try {
      return z
        .string()
        .transform((s) => JSON.parse(s))
        .pipe(OidcSessionCookieData)
        .parse(req.cookies[OIDC_SESSION_COOKIE_NAME]);
    } catch {
      return null;
    }
  },
  set: (res: FastifyReply, data: OidcSessionCookieData) =>
    void res.setCookie(
      OIDC_SESSION_COOKIE_NAME,
      JSON.stringify(data),
      OIDC_SESSION_COOKIE_OPTIONS,
    ),
};
