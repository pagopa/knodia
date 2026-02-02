import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";

const errorCodes = {
  ESERVICE_NOT_FOUND: "0001",
} as const;
// export type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes);

// TODO: remove if unused
// function eserviceNotFound(id: string): ApiError<ErrorCodes> {
//   return createApiError({
//     code: "ESERVICE_NOT_FOUND",
//     detail: `E-service with id ${id} not found`,
//     status: HTTP_STATUS_NOT_FOUND,
//     title: "E-service Not Found",
//   });
// }
