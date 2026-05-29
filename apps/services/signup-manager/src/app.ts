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
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";
import { createProducer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";
import { tokenGeneratorBuilder } from "@knodia/token-generator";

import type { SignupManagerConfig } from "./config/config.ts";

import { oneIdentityClientBuilder } from "./clients/oneIdentityClient.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { signupRouter } from "./routers/signupRouter.ts";
import { signupEventProducerBuilder } from "./services/signupEventProducer.ts";
import { signupServiceBuilder } from "./services/signupService.ts";

/** @knipignore */
export function buildApp({
  config,
  kafkaProducer,
  signupDb,
}: {
  config: SignupManagerConfig;
  kafkaProducer: Awaited<ReturnType<typeof createProducer>>;
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
      signupDbServiceBuilder(signupDb),
      signupEventProducerBuilder({
        producer: kafkaProducer,
        topic: config.signupTopic,
      }),
    ),
  });

  // Protected routes — authenticationPlugin hook is scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
  });

  return app;
}

export async function buildAppFromConfig(config: SignupManagerConfig) {
  const { db: signupDb, pool: signupPool } =
    makeSignupDrizzleConnection(config);

  const kafkaProducer = await createProducer(
    [config.signupTopic],
    config,
    createLogger({ config }),
  );

  const app = buildApp({ config, kafkaProducer, signupDb });

  app.addHook("onClose", async () => {
    await signupPool.end();
  });

  return app;
}
