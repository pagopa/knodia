import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";

const errorCodes = {} as const;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "k2o-gateway",
});
