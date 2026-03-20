import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  OrganizationId,
} from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_FORBIDDEN, HTTP_STATUS_NOT_FOUND } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  AGREEMENT_NOT_FOUND: "0001",
  ORGANIZATION_NOT_FOUND: "0002",
  CONSUMER_MISSING_REQUIRED_ATTRIBUTES: "0003",
} as const;
/* eslint-enable perfectionist/sort-objects */

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

export function consumerMissingRequiredAttributes(
  consumerId: OrganizationId,
  eserviceId: ExternalId<EserviceId>,
) {
  return createApiError<ErrorCodes>({
    code: "CONSUMER_MISSING_REQUIRED_ATTRIBUTES",
    detail: `Consumer ${consumerId} missing required attributes for the requested E-service ${eserviceId}`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Consumer Missing Required Attributes",
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
