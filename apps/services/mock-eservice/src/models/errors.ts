import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";

export const makeApiProblem = makeApiProblemBuilder(
  {},
  {
    forceGenericProblemOn500: true,
    serviceName: "mock-eservice",
  },
);
