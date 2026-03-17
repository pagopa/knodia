import type { HTTPServiceName } from "@knodia/common-models/services";
import type { LoggerConfig } from "@knodia/logger/config";

import fastifyRequestContext, {
  requestContext,
} from "@fastify/request-context";
import {
  CorrelationId,
  generateId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { createLoggerOptions } from "@knodia/logger";
import Fastify, { type FastifyRegisterOptions } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { missingHeader } from "../models/errors/errors.ts";
import { CORRELATION_ID_HEADER } from "../models/headers.ts";
import openapiZodPlugin, {
  type OpenapiZodPluginOptions,
} from "./openapi-zod-plugin/openapiZodPlugin.ts";
import { type MakeApiProblemFn } from "./problemBuilder.ts";

export const createFastifyApp = ({
  fastifyOptions,
  loggerConfig,
  makeApiProblem,
  serviceName,
}: {
  fastifyOptions: FastifyRegisterOptions<OpenapiZodPluginOptions>;
  loggerConfig: LoggerConfig;
  makeApiProblem: MakeApiProblemFn;
  serviceName: HTTPServiceName;
}) => {
  const app = Fastify({
    // Always generate a fresh ID — never read from the incoming header.
    // Frontier services (BFF, k2k-gateway) must not let external callers
    // inject a correlation ID. Internal services that need the header use
    // requireCorrelationIdHeaderPlugin, which overrides the generated value.
    genReqId: () => generateId(),
    logger: createLoggerOptions(loggerConfig, serviceName),
  });

  // openapiPlugin must be registered before any routes to ensure proper route discovery
  app.register(openapiZodPlugin, fastifyOptions);

  app.register(fastifyRequestContext, {
    defaultStoreValues: (req) => {
      const correlationId = unsafeBrandId<CorrelationId>(req.id);
      const logger = req.log.child({ correlationId });
      req.log = logger;

      return {
        correlationId,
        logger,
      };
    },
  });

  app.addContentTypeParser(
    "application/merge-patch+json",
    { parseAs: "string" },
    (_req, body, done) => {
      try {
        done(null, JSON.parse(body.toString()));
      } catch (error) {
        done(error as Error);
      }
    },
  );

  app.setErrorHandler((error, _, res) => {
    const errorRes = makeApiProblem(error);

    return res
      .status(errorRes.status)
      .type("application/problem+json")
      .send(errorRes);
  });

  return app;
};

interface RequireCorrelationIdPluginOptions {
  makeApiProblem: MakeApiProblemFn;
}

export const requireCorrelationIdHeaderPlugin =
  fastifyPlugin<RequireCorrelationIdPluginOptions>(
    async (fastify, { makeApiProblem }) => {
      fastify.addHook("onRequest", async (req, res) => {
        const headerValue = req.headers[CORRELATION_ID_HEADER];
        if (!headerValue) {
          const problem = makeApiProblem(missingHeader(CORRELATION_ID_HEADER));
          return res.status(problem.status).send(problem);
        }

        // Override the auto-generated correlationId with the one from the header.
        // genReqId always generates a fresh ID (to prevent header injection on
        // frontier services), so internal services must propagate the caller's
        // correlation ID here.
        const correlationId = unsafeBrandId<CorrelationId>(
          headerValue.toString(),
        );
        req.id = correlationId;
        requestContext.set("correlationId", correlationId);
        const logger = req.log.child({ correlationId });
        req.log = logger;
        requestContext.set("logger", logger);
      });
    },
  );
