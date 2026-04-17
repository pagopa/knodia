import type { FastifyReply, FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import {
  API_Problem,
  unauthorizedError,
} from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { apiTags } from "../models/apiTags.ts";
import { type authServiceBuilder } from "../services/authService.ts";

interface AuthRouterOptions {
  authService: ReturnType<typeof authServiceBuilder>;
  cookieConfig: {
    domain?: string;
    pathPrefix: string;
    secure: boolean;
  };
}

const REFRESH_COOKIE_NAME = "refresh";
const REFRESH_COOKIE_PATH = "/auth";

const API_SessionRequest = z
  .strictObject({
    oidcToken: z.string(),
  })
  .meta({ id: "SessionRequest" });

const API_SessionResponse = z
  .strictObject({
    uiSessionToken: z.string(),
  })
  .meta({ id: "SessionResponse" });

const API_ExternalUISessionExchangeRequest = z
  .strictObject({
    magicLinkToken: z.string(),
  })
  .meta({ id: "ExternalUISessionExchangeRequest" });

const API_ExternalUISessionExchangeResponse = z
  .strictObject({
    externalUiSessionToken: z.string(),
  })
  .meta({ id: "ExternalUISessionExchangeResponse" });

const API_RefreshCookie = z.object({
  refresh: z
    .string()
    .describe(
      "HttpOnly refresh token (set automatically by login and refresh responses)",
    ),
});

export const authRouter: FastifyPluginAsyncZod<AuthRouterOptions> = async (
  fastify,
  { authService, cookieConfig },
) => {
  const refreshCookiePath = `${cookieConfig.pathPrefix}${REFRESH_COOKIE_PATH}`;

  function setRefreshCookie(res: FastifyReply, refreshToken: string): void {
    void res.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
      domain: cookieConfig.domain,
      httpOnly: true,
      path: refreshCookiePath,
      sameSite: "strict",
      secure: cookieConfig.secure,
    });
  }

  function getRefreshCookie(req: FastifyRequest): string | undefined {
    return req.cookies[REFRESH_COOKIE_NAME];
  }

  function clearRefreshCookie(res: FastifyReply): void {
    void res.clearCookie(REFRESH_COOKIE_NAME, {
      domain: cookieConfig.domain,
      httpOnly: true,
      path: refreshCookiePath,
      sameSite: "strict",
      secure: cookieConfig.secure,
    });
  }

  fastify.route({
    handler: async (req, res) => {
      const { refreshToken, uiSessionToken } =
        await authService.generateUISessionTokenPair(req.body.oidcToken);
      setRefreshCookie(res, refreshToken);

      res.send({ uiSessionToken });
    },
    method: "POST",
    schema: {
      body: API_SessionRequest,
      description:
        "Validate a Cognito token and generate a session token. Sets a HttpOnly refresh token cookie.",
      operationId: "createSession",
      response: {
        200: API_SessionResponse.meta({
          description: "Session created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      security: [],
      tags: [apiTags.auth],
    },
    url: "/auth/ui-session",
  });

  fastify.route({
    handler: async (req, res) => {
      const refreshTokenCookie = getRefreshCookie(req);
      if (!refreshTokenCookie) {
        throw unauthorizedError("Missing refresh token cookie");
      }

      const { refreshToken, uiSessionToken } =
        await authService.refreshUISessionTokenPair(refreshTokenCookie);
      setRefreshCookie(res, refreshToken);

      res.send({ uiSessionToken });
    },
    method: "POST",
    schema: {
      cookies: API_RefreshCookie,
      description:
        "Refresh an expired UI session token using the refresh token cookie",
      operationId: "refreshSession",
      response: {
        200: API_SessionResponse.meta({
          description: "Session refreshed successfully",
        }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      security: [],
      tags: [apiTags.auth],
    },
    url: "/auth/ui-session/refresh",
  });

  fastify.route({
    handler: async (req, res) => {
      const refreshTokenCookie = getRefreshCookie(req);
      if (refreshTokenCookie) {
        await authService.revokeRefreshToken(refreshTokenCookie);
      }
      clearRefreshCookie(res);

      res.status(204).send();
    },
    method: "POST",
    schema: {
      cookies: API_RefreshCookie.partial(),
      description: "Clear the refresh token cookie",
      operationId: "logout",
      response: {
        204: z.undefined().meta({ description: "Logged out successfully" }),
      },
      security: [],
      tags: [apiTags.auth],
    },
    url: "/auth/logout",
  });

  fastify.route({
    handler: async (req, res) => {
      const { externalUiSessionToken } =
        await authService.exchangeMagicLinkToken(req.body.magicLinkToken);
      res.send({ externalUiSessionToken });
    },
    method: "POST",
    schema: {
      body: API_ExternalUISessionExchangeRequest,
      description:
        "Validate a single-use magic-link token and mint a short-lived external-ui-session token scoped to the action in the magic link.",
      operationId: "exchangeExternalUiSession",
      response: {
        200: API_ExternalUISessionExchangeResponse.meta({
          description: "Token exchanged successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      security: [],
      tags: [apiTags.auth],
    },
    url: "/auth/externalUiSession",
  });
};
