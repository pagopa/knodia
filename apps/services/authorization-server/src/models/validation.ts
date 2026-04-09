import type { ApiError } from "@knodia/fastify-zod-api-commons/models";

import type { ErrorCodes } from "./errors.ts";

export interface FailedValidation<T> {
  data: undefined;
  errors: ApiError<T>[];
}

export interface SuccessfulValidation<T> {
  data: T;
  errors: undefined;
}

export type ValidationResult<T> =
  | FailedValidation<ErrorCodes>
  | SuccessfulValidation<T>;

export const successfulValidation = <T>(
  result: T,
): SuccessfulValidation<T> => ({
  data: result,
  errors: undefined,
});

export const failedValidation = (
  // Example: [[error1, error2, undefined], error3, undefined]
  errors: (
    | (ApiError<ErrorCodes> | undefined)[]
    | ApiError<ErrorCodes>
    | undefined
  )[],
): FailedValidation<ErrorCodes> => ({
  data: undefined,
  errors: errors.flat().filter((e) => e !== undefined),
});
