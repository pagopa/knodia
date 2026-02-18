import type { ServiceName } from "@knodia/common-models/services";
import type { LoggerConfig } from "@knodia/logger/config";
import type { LoggerMetadataFastify } from "@knodia/logger/models";

import fastifyRequestContext from "@fastify/request-context";
import { generateId, unsafeBrandId } from "@knodia/common-models/ids";
import { createLoggerOptions } from "@knodia/logger";
import Fastify, {
  type FastifyInstance,
  type FastifyRegisterOptions,
} from "fastify";

import { missingHeader } from "../models/errors/errors.ts";
import { CORRELATION_ID_HEADER } from "../models/headers.ts";
import { healthRouterUrl } from "../routers/healthRouter.ts";
import openapiZodPlugin, {
  docsRoutePrefix,
  type OpenapiZodPluginOptions,
} from "./openapi-zod-plugin/openapiZodPlugin.ts";
import {
  makeApiProblemBuilder,
  type MakeApiProblemFn,
} from "./problemBuilder.ts";

export const createFastifyApp = ({
  fastifyOptions,
  loggerConfig,
  makeApiProblem = makeApiProblemBuilder({}),
  readCorrelationIdFromHeader = true,
  serviceName,
}: {
  fastifyOptions: FastifyRegisterOptions<OpenapiZodPluginOptions>;
  loggerConfig: LoggerConfig;
  makeApiProblem: MakeApiProblemFn;
  readCorrelationIdFromHeader?: boolean;
  serviceName: ServiceName;
}) => {
  const app = Fastify({
    genReqId: (req) =>
      req.headers[CORRELATION_ID_HEADER]?.toString() ?? generateId(),
    logger: createLoggerOptions(loggerConfig, serviceName),
  });

  // openapiPlugin must be registered before any routes to ensure proper route discovery
  app.register(openapiZodPlugin, fastifyOptions);

  app.register(fastifyRequestContext, {
    defaultStoreValues: (req) => {
      const loggerMetadata: LoggerMetadataFastify = {
        correlationId: unsafeBrandId(req.id),
        organizationId: generateId(),
      };

      const logger = req.log.child(loggerMetadata);
      req.log = logger;

      return {
        correlationId: loggerMetadata.correlationId,
        logger,
        serviceName,
      };
    },
  });

  checkCorrelationIdHeader(app, makeApiProblem, readCorrelationIdFromHeader);

  app.setErrorHandler((error, _, res) => {
    const errorRes = makeApiProblem(error);

    return res
      .status(errorRes.status)
      .type("application/problem+json")
      .send(errorRes);
  });

  return app;
};

const checkCorrelationIdHeader = (
  app: FastifyInstance,
  makeApiProblem: MakeApiProblemFn,
  readCorrelationIdFromHeader: boolean,
) => {
  if (readCorrelationIdFromHeader) {
    app.addHook("onRequest", async (req, res) => {
      if (req.url === healthRouterUrl || req.url.startsWith(docsRoutePrefix))
        return;

      const correlationId = req.headers[CORRELATION_ID_HEADER];
      if (!correlationId) {
        const problem = makeApiProblem(missingHeader(CORRELATION_ID_HEADER));
        return res.status(problem.status).send(problem);
      }
    });
  }
};
