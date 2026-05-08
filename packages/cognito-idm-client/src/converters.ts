import type { UserType } from "@aws-sdk/client-cognito-identity-provider";

import { IdmUser } from "./models.ts";

export function toIdmUser(user: UserType): IdmUser {
  const attributes = new Map(
    (user.Attributes ?? []).map((attr) => [attr.Name, attr.Value]),
  );

  return IdmUser.parse({
    email: attributes.get("email"),
    id: attributes.get("sub"),
    roles: attributes.get("custom:roles"),
    username: user.Username,
  });
}
