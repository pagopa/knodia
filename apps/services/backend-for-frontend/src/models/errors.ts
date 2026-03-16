import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_INTERNAL_SERVER_ERROR } = constants;

const errorCodes = {
  POLLING_MAX_RETRIES_EXCEEDED: "0001",
};
type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "backend-for-frontend",
});

export function pollingMaxRetriesExceeded(
  retries: number,
  retryDelayMs: number,
) {
  return createApiError<ErrorCodes>({
    code: "POLLING_MAX_RETRIES_EXCEEDED",
    detail: `Polling exceeded maximum retries (${retries}) with delay ${retryDelayMs}ms`,
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "Polling max retries exceeded",
  });
}
