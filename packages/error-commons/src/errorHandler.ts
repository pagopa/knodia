import { type FastifyInstance } from "fastify";

import { emptyErrorMapper, makeApiProblemBuilder } from "./errors.ts";
import { ServiceName } from "./services.ts";

const makeApiProblem = makeApiProblemBuilder({});

export const registerErrorHandler = (
  app: FastifyInstance,
  context: {
    // TODO: CorrelationId type
    correlationId: string;
    logger: {
      error: (message: string) => void;
      warn: (message: string) => void;
    };
    serviceName: ServiceName;
  },
) => {
  app.setErrorHandler((error, _, res) => {
    // TODO: fix context
    const errorRes = makeApiProblem(error, emptyErrorMapper, context);

    return res
      .status(errorRes.status)
      .type("application/problem+json")
      .send(errorRes);
  });
};
