import { makeApiProblemBuilder } from "@knodia/error-commons";

const errorCodes = {
  ESERVICE_NOT_FOUND: "ESERVICE_NOT_FOUND",
} as const;
export type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes);

// export function eserviceNotFound(id: string): ApiError<ErrorCodes> {
//   return createApiError(
//     "ESERVICE_NOT_FOUND",
//     `E-service with id ${id} not found`,
//     "E-service Not Found",
//   );
// }
