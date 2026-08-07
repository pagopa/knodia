import type { Producer } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { SignupTopicConfig } from "@knodia/kafka-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import cookie from "@fastify/cookie";
import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import { makeSignupDrizzleConnection } from "@knodia/db-signup/utils";
import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import {
  type RateLimiter,
  rateLimitPlugin,
  rateLimitResponseHeadersPlugin,
} from "@knodia/fastify-zod-api-commons/rate-limit";
import {
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";
import { createProducer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";
import { tokenGeneratorBuilder } from "@knodia/token-generator";

import type {
  EmailAllowlistConfig,
  OneIdentityConfig,
  SignupManagerConfig,
} from "./config/config.ts";

import { oneIdentityClientBuilder } from "./clients/oneIdentityClient.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { authRouter } from "./routers/authRouter.ts";
import { signupRouter } from "./routers/signupRouter.ts";
import { authServiceBuilder } from "./services/authService.ts";
import { signupEventProducerBuilder } from "./services/signupEventProducer.ts";
import { signupServiceBuilder } from "./services/signupService.ts";

export function buildApp({
  config,
  kafkaProducer,
  rateLimiter,
  signupDb,
}: {
  config: AuthConfig &
    EmailAllowlistConfig &
    LoggerConfig &
    OneIdentityConfig &
    SignupTopicConfig;
  kafkaProducer: Producer;
  rateLimiter: RateLimiter;
  signupDb: NodePgDatabase;
}) {
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
            description: "Authentication routes",
            name: apiTags.auth,
          },
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
  app.register(rateLimitResponseHeadersPlugin);

  const authService = authServiceBuilder(
    config,
    oneIdentityClientBuilder(config),
    tokenGeneratorBuilder(),
    rateLimiter,
  );

  const signupService = signupServiceBuilder(
    signupDbServiceBuilder(signupDb),
    signupEventProducerBuilder({
      producer: kafkaProducer,
      topic: config.signupTopic,
    }),
    config.allowedEmailDomains,
  );

  // Public routes (no auth required)
  app.register(healthRouter);
  app.register(authRouter, {
    authService,
  });

  // Protected routes — authenticationPlugin hook is scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(rateLimitPlugin, { rateLimiter });
    protectedApp.register(signupRouter, { signupService });
  });

  app.addHook("onClose", async () => {
    await rateLimiter.disconnect();
  });

  return app;
}

export async function buildAppFromConfig(
  config: SignupManagerConfig,
  rateLimiter: RateLimiter,
  options: { checkDbConnection?: boolean } = {},
) {
  const { db: signupDb, pool: signupPool } = await makeSignupDrizzleConnection(
    config,
    {
      checkConnection: options.checkDbConnection,
    },
  );

  const kafkaProducer = await createProducer(
    [config.signupTopic],
    config,
    createLogger({ config }),
  );

  const app = buildApp({ config, kafkaProducer, rateLimiter, signupDb });

  app.addHook("onClose", async () => {
    await signupPool.end();
  });

  return app;
}
