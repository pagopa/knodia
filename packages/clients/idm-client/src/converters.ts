import type { UserType } from "@aws-sdk/client-cognito-identity-provider";

import { genericInternalError } from "@knodia/common-models/errors";

import { IdmUser } from "./models.js";

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

  return IdmUser.parse({
    email: requireAttribute("email", id),
    id,
    roles: requireAttribute("custom:roles", id),
    username: user.Username,
  });
}
