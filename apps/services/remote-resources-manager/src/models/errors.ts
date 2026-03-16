import type { OrganizationId } from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_FORBIDDEN } = constants;

const errorCodes = {
  ORGANIZATION_NOT_FOUND: "0001",
};
type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "remote-resources-manager",
});

export function organizationNotFound(organizationId: OrganizationId) {
  return createApiError<ErrorCodes>({
    code: "ORGANIZATION_NOT_FOUND",
    detail: `Organization with id ${organizationId} not found`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Organization Not Found",
  });
}
