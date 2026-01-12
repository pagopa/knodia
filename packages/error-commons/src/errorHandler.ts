import { type FastifyInstance } from "fastify";

import { emptyErrorMapper, makeApiProblemBuilder } from "./errors.ts";
import { ServiceName } from "./services.ts";

const makeApiProblem = makeApiProblemBuilder({});

export const registerErrorHandler = (
  app: FastifyInstance,
  serviceName: ServiceName,
) => {
  app.setErrorHandler((error, req, res) => {
    // TODO: fix context
    const errorRes = makeApiProblem(error, emptyErrorMapper, {
      correlationId: req.id,
      logger: req.log,
      serviceName,
    });

    return res
      .status(errorRes.status)
      .type("application/problem+json")
      .send(errorRes);
  });
};
