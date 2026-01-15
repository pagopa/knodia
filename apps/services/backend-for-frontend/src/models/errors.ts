import { makeApiProblemBuilder } from "@knodia/error-commons";

export const errorCodes = {};
export type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
});
