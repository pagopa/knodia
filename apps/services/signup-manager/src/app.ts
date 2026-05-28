import cookie from "@fastify/cookie";
import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import {
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";
import { tokenGeneratorBuilder } from "@knodia/token-generator";

import type { SignupManagerConfig } from "./config/config.ts";

import { oneIdentityClientBuilder } from "./clients/oneIdentityClient.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { signupRouter } from "./routers/signupRouter.ts";
import { signupServiceBuilder } from "./services/signupService.ts";

/** @knipignore */
export function buildApp({ config }: { config: SignupManagerConfig }) {
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description: "API for managing Knodia Signup Manager",
          title: "Knodia Signup Manager API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
        servers: [{ description: "Signup Manager API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Signup routes",
            name: apiTags.signup,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
  });

  app.register(cookie);

  // Public routes (no auth required)
  app.register(healthRouter);
  app.register(signupRouter, {
    signupService: signupServiceBuilder(
      config,
      oneIdentityClientBuilder(config),
      tokenGeneratorBuilder(),
    ),
  });

  // Protected routes — authenticationPlugin hook is scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
  });

  return app;
}

export function buildAppFromConfig(config: SignupManagerConfig) {
  const app = buildApp({ config });

  return app;
}
