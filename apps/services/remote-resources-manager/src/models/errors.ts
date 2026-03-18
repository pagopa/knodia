import type { ExternalId } from "@knodia/common-models/externalResource";
import type { AgreementId } from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_NOT_FOUND } = constants;

const errorCodes = {
  AGREEMENT_NOT_FOUND: "0001",
} as const;

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "remote-resources-manager",
});

export function agreementNotFound(agreementId: ExternalId<AgreementId>) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_NOT_FOUND",
    detail: `Agreement with id ${agreementId} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Agreement Not Found",
  });
}
