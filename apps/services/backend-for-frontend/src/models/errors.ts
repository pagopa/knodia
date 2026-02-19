import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const errorCodes = {
  UNAUTHORIZED: "0001",
} as const;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
});

export function unauthorizedError(detail: string) {
  return createApiError({
    code: "UNAUTHORIZED",
    detail,
    status: constants.HTTP_STATUS_UNAUTHORIZED,
    title: "Unauthorized",
  });
}
