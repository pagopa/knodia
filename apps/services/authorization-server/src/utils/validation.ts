import type { API_TokenRequest } from "../models/api.ts";

import {
  EXPECTED_CLIENT_ASSERTION_TYPE,
  EXPECTED_GRANT_TYPE,
} from "../models/constants.ts";
import {
  invalidClientAssertionType,
  invalidGrantType,
} from "../models/errors.ts";
import {
  failedValidation,
  successfulValidation,
  type ValidationResult,
} from "../models/validation.ts";

export const validateRequestParameters = (
  request: API_TokenRequest,
): ValidationResult<API_TokenRequest> => {
  const clientAssertionTypeError =
    request.client_assertion_type !== EXPECTED_CLIENT_ASSERTION_TYPE
      ? invalidClientAssertionType(request.client_assertion_type)
      : undefined;

  const grantTypeError =
    request.grant_type !== EXPECTED_GRANT_TYPE
      ? invalidGrantType(request.grant_type)
      : undefined;

  if (!clientAssertionTypeError && !grantTypeError) {
    return successfulValidation(request);
  }

  return failedValidation([clientAssertionTypeError, grantTypeError]);
};
