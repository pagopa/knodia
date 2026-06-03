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
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";
import { createProducer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";
import { tokenGeneratorBuilder } from "@knodia/token-generator";

import type {
  OneIdentityConfig,
  SignupManagerConfig,
} from "./config/config.ts";

import { oneIdentityClientBuilder } from "./clients/oneIdentityClient.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { protectedSignupRouter, signupRouter } from "./routers/signupRouter.ts";
import { signupEventProducerBuilder } from "./services/signupEventProducer.ts";
import { signupServiceBuilder } from "./services/signupService.ts";

export function buildApp({
  config,
  kafkaProducer,
  signupDb,
}: {
  config: AuthConfig & LoggerConfig & OneIdentityConfig & SignupTopicConfig;
  kafkaProducer: Producer;
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

  const signupService = signupServiceBuilder(
    config,
    oneIdentityClientBuilder(config),
    tokenGeneratorBuilder(),
    signupDbServiceBuilder(signupDb),
    signupEventProducerBuilder({
      producer: kafkaProducer,
      topic: config.signupTopic,
    }),
  );

  // Public routes (no auth required)
  app.register(healthRouter);
  app.register(signupRouter, {
    signupService,
  });

  // Protected routes — authenticationPlugin hook is scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(protectedSignupRouter, { signupService });
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
