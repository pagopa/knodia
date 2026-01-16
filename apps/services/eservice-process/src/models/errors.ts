import {
  ApiError,
  createApiError,
  makeApiProblemBuilder,
} from "@knodia/error-commons";

const errorCodes = {
  ESERVICE_NOT_FOUND: { code: "ESERVICE_NOT_FOUND", number: "0001" },
} as const;
export type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes);

export function eserviceNotFound(id: string): ApiError<ErrorCodes> {
  return createApiError(
    errorCodes.ESERVICE_NOT_FOUND.code,
    `E-service with id ${id} not found`,
    "E-service Not Found",
  );
}
