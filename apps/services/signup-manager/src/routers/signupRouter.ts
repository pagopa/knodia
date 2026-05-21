import type { FastifyReply, FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { generateId } from "@knodia/common-models/ids";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import type { SignupService } from "../services/signupService.ts";

import { apiTags } from "../models/apiTags.ts";

interface SignupRouterOptions {
  signupService: SignupService;
}

const OIDC_SESSION_COOKIE_NAME = "oidc-session";

const API_OIDCCallbackQuery = z.object({
  code: z.string(),
  state: z.string(),
});

const API_SessionResponse = z
  .strictObject({
    sessionToken: z.string(),
  })
  .meta({ id: "SessionResponse" });

export const signupRouter: FastifyPluginAsyncZod<SignupRouterOptions> = async (
  fastify,
  { signupService },
) => {
  fastify.route({
    handler: async (_req, res) => {
      const nonce = generateId();
      const state = generateId();

      const { loginUrl } = signupService.startOIDCSession({
        nonce,
        state,
      });
      setOidcSessionCookie(res, state, nonce);

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
      tags: [apiTags.signup],
    },
    url: "/auth/oidc/start",
  });

  fastify.route({
    handler: async (req, res) => {
      const oidcSession = getOidcSessionCookie(req);

      const { sessionToken } = await signupService.exchangeOIDCCode({
        code: req.query.code,
        oidcSession,
        state: req.query.state,
      });

      void clearOidcSessionCookie(res);
      res.status(200).send({ sessionToken });
    },
    method: "GET",
    schema: {
      description:
        "Handle OIDC callback and exchange authorization code for session token",
      operationId: "exchangeOIDCCode",
      querystring: API_OIDCCallbackQuery,
      response: {
        200: API_SessionResponse.meta({
          description: "OIDC login successful, session token returned",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.signup],
    },
    url: "/auth/oidc/token",
  });
};

function clearOidcSessionCookie(res: FastifyReply): void {
  void res.clearCookie(OIDC_SESSION_COOKIE_NAME, {
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: "auto",
  });
}

function getOidcSessionCookie(
  req: FastifyRequest,
): null | { nonce: string; state: string } {
  const cookie = req.cookies[OIDC_SESSION_COOKIE_NAME];
  if (!cookie) return null;
  return JSON.parse(cookie);
}

function setOidcSessionCookie(
  res: FastifyReply,
  state: string,
  nonce: string,
): void {
  void res.setCookie(
    OIDC_SESSION_COOKIE_NAME,
    JSON.stringify({ nonce, state }),
    {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: "auto",
    },
  );
}
