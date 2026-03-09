import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import {
  API_Problem,
  unauthorizedError,
} from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { type BffProcessConfig } from "../config/config.ts";
import { apiTags } from "../models/apiTags.ts";
import { type authServiceBuilder } from "../services/authService.ts";

interface AuthRouterOptions {
  authService: ReturnType<typeof authServiceBuilder>;
  config: BffProcessConfig;
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

export const authRouter: FastifyPluginAsyncZod<AuthRouterOptions> = async (
  fastify,
  { authService, config },
) => {
  function setRefreshCookie(
    res: Parameters<Parameters<typeof fastify.route>[0]["handler"]>[1],
    refreshToken: string,
  ): void {
    void res.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
      domain: config.cookie.domain,
      httpOnly: true,
      path: REFRESH_COOKIE_PATH,
      sameSite: "strict",
      secure: config.cookie.secure,
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
      description: "Validate a Cognito token and generate a session token",
      operationId: "createSession",
      response: {
        200: API_SessionResponse.meta({
          description: "Session created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      tags: [apiTags.auth],
    },
    url: "/auth/ui-session",
  });

  fastify.route({
    handler: async (req, res) => {
      const refreshCookie = req.cookies[REFRESH_COOKIE_NAME];
      if (!refreshCookie) {
        throw unauthorizedError("Missing refresh token cookie");
      }
      const { refreshToken, uiSessionToken } =
        await authService.refreshUISessionTokenPair(refreshCookie);
      setRefreshCookie(res, refreshToken);
      res.send({ uiSessionToken });
    },
    method: "POST",
    schema: {
      description:
        "Refresh an expired UI session token using the refresh token cookie",
      operationId: "refreshSession",
      response: {
        200: API_SessionResponse.meta({
          description: "Session refreshed successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      tags: [apiTags.auth],
    },
    url: "/auth/ui-session/refresh",
  });

  fastify.route({
    handler: async (_req, res) => {
      void res.clearCookie(REFRESH_COOKIE_NAME, {
        domain: config.cookie.domain,
        httpOnly: true,
        path: REFRESH_COOKIE_PATH,
        sameSite: "strict",
        secure: config.cookie.secure,
      });
      res.status(204).send();
    },
    method: "POST",
    schema: {
      description: "Clear the refresh token cookie",
      operationId: "logout",
      response: {
        204: z.undefined().meta({ description: "Logged out successfully" }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      tags: [apiTags.auth],
    },
    url: "/auth/logout",
  });
};
