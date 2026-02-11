import type { LoggerConfig } from "@knodia/logger/config";

import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { serviceName } from "@knodia/fastify-zod-api-commons/models";

import { type RemoteResourcesManagerConfig } from "./config/config.ts";
import { remoteResourcesManagerRouterTag } from "./models/apiTag.ts";
import { makeApiProblem } from "./models/errors.ts";

export function buildAppFromConfig(config: RemoteResourcesManagerConfig) {
  const app = buildApp({
    loggerConfig: config,
  });

  return app;
}

function buildApp({ loggerConfig }: { loggerConfig: LoggerConfig }) {
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description: "Knodia remote-resources-manager API",
          title: "Knodia Remote Resources Manager API",
          version: "1.0.0",
        },
        servers: [{ description: "Remote Resources Manager API", url: "/" }],
        tags: [healthRouterTag, remoteResourcesManagerRouterTag],
      },
    },
    loggerConfig: loggerConfig,
    makeApiProblem,
    readCorrelationIdFromHeader: false,
    serviceName: serviceName.REMOTE_RESOURCES_MANAGER,
  });

  app.register(healthRouter);

  return app;
}
