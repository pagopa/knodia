import type {
  AdminGetUserCommandOutput,
  UserType,
} from "@aws-sdk/client-cognito-identity-provider";

import { IdmUser } from "./models.ts";

export function toIdmUser(user: AdminGetUserCommandOutput | UserType): IdmUser {
  const attributes = new Map(
    (
      (user as AdminGetUserCommandOutput).UserAttributes ??
      (user as UserType).Attributes ??
      []
    ).map((attr) => [attr.Name, attr.Value]),
  );

  return IdmUser.parse({
    email: attributes.get("email"),
    enabled: user.Enabled,
    id: attributes.get("sub"),
    roles: attributes.get("custom:roles"),
    username: user.Username,
  });
}
