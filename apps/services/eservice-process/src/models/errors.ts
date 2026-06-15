import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  EserviceInterfaceId,
  EserviceTemplateId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type {
  Eservice,
  EserviceMode,
  EserviceVersionState,
} from "@knodia/eservice-models";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

export type ExternalUISessionEserviceClaimField =
  | "eservice.id"
  | "eservice.knodeId";

const {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NOT_FOUND,
} = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  ESERVICE_NOT_FOUND: "0001",
  INVALID_ATTRIBUTE: "0002",
  INVALID_CATEGORY: "0003",
  ESERVICE_VERSION_NOT_FOUND: "0004",
  INTERFACE_NOT_FOUND: "0005",
  DUPLICATE_INTERFACE_ID: "0006",
  INCONSISTENT_DAILY_CALLS: "0007",
  ORGANIZATION_NOT_FOUND: "0008",
  ESERVICE_VERSION_NOT_IN_EXPECTED_STATES: "0009",
  NOT_ESERVICE_PRODUCER: "0010",
  ESERVICE_TEMPLATE_NOT_FOUND: "0011",
  ESERVICE_TEMPLATE_INSTANCE_CANNOT_BE_UPDATED: "0012",
  ESERVICE_TOKEN_CLAIM_MISMATCH: "0013",
  ESERVICE_MODE_NOT_ALLOWED: "0014",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export function eserviceTokenClaimMismatch(
  field: ExternalUISessionEserviceClaimField,
  tokenValue: string,
  expectedValue: string,
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_TOKEN_CLAIM_MISMATCH",
    detail: `Token claim "${field}" (${tokenValue}) does not match expected value (${expectedValue})`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "E-service Token Claim Mismatch",
  });
}

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "eservice-process",
});

export function duplicateInterfaceId(interfaceId: EserviceInterfaceId) {
  return createApiError<ErrorCodes>({
    code: "DUPLICATE_INTERFACE_ID",
    detail: `An interface document with id ${interfaceId} already exists`,
    status: HTTP_STATUS_CONFLICT,
    title: "Duplicate Interface Document",
  });
}

export function eserviceModeNotAllowed(
  eserviceId: EserviceId,
  actualMode: EserviceMode,
  expectedMode: EserviceMode,
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_MODE_NOT_ALLOWED",
    detail: `E-service ${eserviceId} has mode ${actualMode}, expected ${expectedMode}`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Mode Not Allowed",
  });
}

export function eserviceNotFound(id: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_NOT_FOUND",
    detail: `E-service with id ${id} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Not Found",
  });
}

export function eserviceTemplateInstanceFieldsCannotBeUpdated(
  eserviceId: EserviceId,
  templateId: ExternalId<EserviceTemplateId>,
  fields: (keyof Eservice)[],
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_TEMPLATE_INSTANCE_CANNOT_BE_UPDATED",
    detail: `E-service ${eserviceId} is an instance of template ${templateId}; template-defined fields ${fields.join(", ")} cannot be updated`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Template Instance Cannot Be Updated",
  });
}

export function eserviceTemplateNotFound(
  templateId: EserviceTemplateId,
  knodeId: KnodeId,
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_TEMPLATE_NOT_FOUND",
    detail: `E-service template with id ${templateId} not found for knode ${knodeId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Template Not Found",
  });
}

export function eserviceVersionNotFound(
  eserviceId: EserviceId,
  versionId?: EserviceVersionId,
) {
  const detail = versionId
    ? `E-service version '${versionId}' not found for e-service '${eserviceId}'`
    : `No versions found for e-service '${eserviceId}'`;

  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_FOUND",
    detail,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Version Not Found",
  });
}

export function eserviceVersionNotInExpectedStates(
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  allowedStates: EserviceVersionState[],
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_IN_EXPECTED_STATES",
    detail: `E-service version ${eserviceVersionId} of E-service ${eserviceId} is not in an allowed state: [${allowedStates.join(", ")}]`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Version Not in Expected States",
  });
}

export function inconsistentDailyCalls() {
  return createApiError<ErrorCodes>({
    code: "INCONSISTENT_DAILY_CALLS",
    detail: `maxDailyCallsPerConsumer can't be greater than maxDailyCallsPerKnode`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Inconsistent daily calls",
  });
}

export function interfaceNotFound(
  eserviceId: EserviceId,
  versionId?: EserviceVersionId,
) {
  return createApiError<ErrorCodes>({
    code: "INTERFACE_NOT_FOUND",
    detail: versionId
      ? `Interface document not found for E-service ${eserviceId} and version ${versionId}`
      : `No interface document found for E-service ${eserviceId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Interface Document Not Found",
  });
}

export function invalidAttribute(scheme: string, code: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_ATTRIBUTE",
    detail: `Invalid attribute: scheme=${scheme}, code=${code}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid Attribute",
  });
}

export function invalidCategory(scheme: string, code: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_CATEGORY",
    detail: `Invalid category: scheme=${scheme}, code=${code}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid Category",
  });
}

export function notEserviceProducer(
  eserviceId: EserviceId,
  organizationId: OrganizationId,
) {
  return createApiError<ErrorCodes>({
    code: "NOT_ESERVICE_PRODUCER",
    detail: `Operation not allowed: organization ${organizationId} is not the producer of E-service ${eserviceId}. Only the producer of an E-service can perform this operation.`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Caller is not the E-service producer",
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
