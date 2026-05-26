import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";

const errorCodes = {} as const;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "signup-manager",
});
