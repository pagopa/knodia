import {
  ApiError,
  createApiError,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const errorCodes = {
  ESERVICE_NOT_FOUND: "0001",
} as const;
type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes);

export function eserviceNotFound(id: string): ApiError<ErrorCodes> {
  return createApiError({
    code: "ESERVICE_NOT_FOUND",
    detail: `E-service with id ${id} not found`,
    status: constants.HTTP_STATUS_NOT_FOUND,
    title: "E-service Not Found",
  });
}
