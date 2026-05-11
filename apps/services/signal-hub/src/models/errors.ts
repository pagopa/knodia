import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";

const errorCodes = {} as const;

// type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "signal-hub",
});
