import type {
  EserviceTemplateId,
  KnodeId,
  PurposeTemplateId,
} from "@knodia/common-models/ids";

import {
  type ApiError,
  createApiError,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_NOT_FOUND } = constants;

const errorCodes = {
  ESERVICE_TEMPLATE_NOT_FOUND: "0001",
  INVALID_INTERFACE_FILE_NAME: "0003",
  PURPOSE_TEMPLATE_NOT_FOUND: "0002",
};

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "backend-for-frontend",
});

export function eserviceTemplateNotFound(
  eserviceTemplateId: EserviceTemplateId,
  knodeId: KnodeId,
): ApiError<ErrorCodes> {
  return createApiError({
    code: "ESERVICE_TEMPLATE_NOT_FOUND",
    detail: `E-service Template with ID ${eserviceTemplateId} not found in Knode ${knodeId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Template not found",
  });
}

export function invalidInterfaceFileName(
  fileName: string,
): ApiError<ErrorCodes> {
  return createApiError({
    code: "INVALID_INTERFACE_FILE_NAME",
    detail: `Interface document "${fileName}" must be an OpenAPI spec with a .json, .yaml or .yml extension`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid interface document file name",
  });
}

export function purposeTemplateNotFound(
  purposeTemplateId: PurposeTemplateId,
  knodeId: KnodeId,
): ApiError<ErrorCodes> {
  return createApiError({
    code: "PURPOSE_TEMPLATE_NOT_FOUND",
    detail: `Purpose Template with ID ${purposeTemplateId} not found in Knode ${knodeId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Purpose Template not found",
  });
}
