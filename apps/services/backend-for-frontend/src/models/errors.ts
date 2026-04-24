import {
  type ApiError,
  createApiError,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_NOT_FOUND } = constants;

const errorCodes = {
  ESERVICE_TEMPLATE_NOT_FOUND: "0001",
};

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "backend-for-frontend",
});

export function eserviceTemplateNotFound(
  eserviceTemplateId: string,
): ApiError<ErrorCodes> {
  return createApiError({
    code: "ESERVICE_TEMPLATE_NOT_FOUND",
    detail: `E-service Template with ID ${eserviceTemplateId} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Template not found",
  });
}
