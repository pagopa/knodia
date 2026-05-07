import type { LoggerConfig } from "@knodia/logger/config";

import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";

import type { SignalHubConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";

export function buildAppFromConfig(config: SignalHubConfig) {
  const app = buildApp({
    config,
  });

  return app;
}

function buildApp({ config }: { config: LoggerConfig }) {
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description: "API for managing Knodia Signal Hub",
          title: "Knodia Signal Hub API",
          version: "1.0.0",
        },
        servers: [{ description: "Signal Hub API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Signal Hub routes",
            name: apiTags.signalHub,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
  });

  // Public routes (no auth required)
  app.register(healthRouter);

  return app;
}
