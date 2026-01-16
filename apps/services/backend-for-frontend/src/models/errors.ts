import { makeApiProblemBuilder } from "@knodia/error-commons";

const errorCodes = {};
// export type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
});
