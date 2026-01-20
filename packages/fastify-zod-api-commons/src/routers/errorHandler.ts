import { type FastifyInstance } from "fastify";

import { emptyErrorMapper } from "../utils/errors/errorMappers.ts";
import { makeApiProblemBuilder } from "../utils/errors/problemBuilder.ts";

const makeApiProblem = makeApiProblemBuilder({});

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error, _, res) => {
    const errorRes = makeApiProblem(error, emptyErrorMapper);

    return res
      .status(errorRes.status)
      .type("application/problem+json")
      .send(errorRes);
  });
};
