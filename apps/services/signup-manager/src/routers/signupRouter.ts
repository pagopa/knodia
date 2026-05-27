import type { SerializeOptions } from "@fastify/cookie";
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

export const OIDC_SESSION_COOKIE_NAME = "oidc-session";
const OIDC_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "strict",
  secure: true,
} as const satisfies SerializeOptions;

const OidcSessionCookieData = z.object({
  nonce: z.string(),
  state: z.string(),
});

type OidcSessionCookieData = z.infer<typeof OidcSessionCookieData>;

const API_OIDCCallbackQuery = z.object({
  code: z.string(),
  state: z.string(),
});

const API_SessionResponse = z
  .strictObject({
    uiSignupSessionToken: z.string(),
  })
  .meta({ id: "SessionResponse" });

const API_OIDCSessionCookie = z.object({
  [OIDC_SESSION_COOKIE_NAME]: z.string().optional().meta({
    description:
      "HttpOnly cookie carrying the OIDC state and nonce (set by /auth/oidc/start)",
  }),
});

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
