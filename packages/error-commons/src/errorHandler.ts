import { type FastifyInstance } from "fastify";

import { emptyErrorMapper, makeApiProblemBuilder } from "./errors.ts";

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
