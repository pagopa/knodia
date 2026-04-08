import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";

const errorCodes = {};

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "authorization-server",
});
