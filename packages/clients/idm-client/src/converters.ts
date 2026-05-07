import type { UserType } from "@aws-sdk/client-cognito-identity-provider";

import { UserRole } from "@knodia/common-models/auth";
import { genericInternalError } from "@knodia/common-models/errors";
import { unsafeBrandUserId } from "@knodia/common-models/ids";

import type { IdmUser } from "./models.ts";

export function toIdmUser(user: UserType): IdmUser {
  const attributes = new Map(
    (user.Attributes ?? []).map((attr) => [attr.Name, attr.Value]),
  );

  const requireAttribute = (attributeName: string, userId?: string): string => {
    const value = attributes.get(attributeName);
    if (!value)
      throw genericInternalError(
        `User ${userId ?? "unknown"} is missing required attribute ${attributeName}`,
      );

    return value;
  };

  const id = requireAttribute("sub");
  const email = requireAttribute("email", id);
  const roles = requireAttribute("custom:roles", id)
    .split(",")
    .map((s) => s.trim())
    .filter((role): role is UserRole => UserRole.safeParse(role).success);

  if (roles.length === 0)
    throw genericInternalError(`User ${id} is missing required roles`);

  const username = user.Username;
  if (!username)
    throw genericInternalError(`User ${id} is missing required username`);

  return {
    email,
    id: unsafeBrandUserId(id),
    roles,
    username,
  };
}
