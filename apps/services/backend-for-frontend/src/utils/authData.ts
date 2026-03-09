import type {
  AuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";

import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";

export function getUISessionAuthData(
  authData: AuthData | undefined,
): UISessionAuthData {
  if (authData?.tokenType !== "ui-session") {
    throw unauthorizedError("A valid ui-session token is required");
  }
  return authData;
}
