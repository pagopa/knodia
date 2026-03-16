import type { PurposeId } from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_NOT_FOUND } = constants;

const errorCodes = {
  PURPOSE_NOT_FOUND: "0001",
} as const;

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "purpose-process",
});

export function purposeNotFound(id: PurposeId) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_FOUND",
    detail: `Purpose with id ${id} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Purpose Not Found",
  });
}
