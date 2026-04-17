import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_FORBIDDEN, HTTP_STATUS_NOT_FOUND } = constants;

const errorCodes = {
  AGREEMENT_NOT_FOUND: "0001",
  AGREEMENT_NOT_OWNED_BY_CALLER: "0004",
  ORGANIZATION_NOT_FOUND: "0002",
  PURPOSE_NOT_FOUND: "0003",
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

export function agreementNotOwnedByCaller(
  agreementId: ExternalId<AgreementId>,
) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_NOT_OWNED_BY_CALLER",
    detail: `Agreement with id ${agreementId} is not owned by the calling organization`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Agreement Not Owned By Caller",
  });
}

export function organizationNotFound(organizationId: OrganizationId) {
  return createApiError<ErrorCodes>({
    code: "ORGANIZATION_NOT_FOUND",
    detail: `Organization with id ${organizationId} not found`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Organization Not Found",
  });
}

export function purposeNotFound(purposeId: ExternalId<PurposeId>) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_FOUND",
    detail: `Purpose with id ${purposeId} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Purpose Not Found",
  });
}
