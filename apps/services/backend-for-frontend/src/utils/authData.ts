import type {
  AuthData,
  ExternalUISessionAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";

import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";

export function getExternalUiSessionAuthData(
  authData: AuthData | undefined,
): ExternalUISessionAuthData {
  if (authData?.tokenType !== "external-ui-session") {
    throw unauthorizedError("A valid external-ui-session token is required");
  }
  return authData;
}

export function getUISessionAuthData(
  authData: AuthData | undefined,
): UISessionAuthData {
  if (authData?.tokenType !== "ui-session") {
    throw unauthorizedError("A valid ui-session token is required");
  }
  return authData;
}
