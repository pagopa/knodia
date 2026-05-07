import {
  AdminListGroupsForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { UserRole } from "@knodia/common-models/auth";
import { genericInternalError } from "@knodia/common-models/errors";
import {
  type OrganizationId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";
import { CommaSeparatedArray } from "@knodia/common-models/types";

export interface IdmUser {
  email: string;
  id: UserId;
  roles: UserRole[];
  username: string;
}

export type UserService = ReturnType<typeof userServiceBuilder>;

export function userServiceBuilder({ userPoolId }: { userPoolId: string }) {
  const client = new CognitoIdentityProviderClient();

  return {
    async checkUserBelongsToOrganization(
      user: IdmUser,
      organizationId: OrganizationId,
    ): Promise<boolean> {
      let nextToken: string | undefined;

      do {
        const response = await client.send(
          new AdminListGroupsForUserCommand({
            Limit: 60, // Max limit per AWS docs
            NextToken: nextToken,
            Username: user.username,
            UserPoolId: userPoolId,
          }),
        );

        const groupNames =
          response.Groups?.map((group) => group.GroupName) ?? [];

        if (groupNames.includes(getOrganizationGroupName(organizationId))) {
          return true;
        }

        nextToken = response.NextToken;
      } while (nextToken);

      return false;
    },

    async getOrganizationUsers(
      organizationId: OrganizationId,
    ): Promise<IdmUser[]> {
      const users: UserType[] = [];
      let nextToken: string | undefined;

      do {
        const response = await client.send(
          new ListUsersInGroupCommand({
            GroupName: getOrganizationGroupName(organizationId),
            Limit: 60, // Max limit per AWS docs
            NextToken: nextToken,
            UserPoolId: userPoolId,
          }),
        );

        users.push(...(response.Users ?? []));
        nextToken = response.NextToken;
      } while (nextToken);

      return users.map(toIdmUser);
    },

    async getUserById(userId: UserId): Promise<IdmUser | undefined> {
      const response = await client.send(
        new ListUsersCommand({
          Filter: `sub = "${userId}"`,
          Limit: 1,
          UserPoolId: userPoolId,
        }),
      );

      const user = response.Users?.at(0);
      return user ? toIdmUser(user) : undefined;
    },
  };
}

function getOrganizationGroupName(organizationId: OrganizationId) {
  return `org:${organizationId}`;
}

function toIdmUser(user: UserType): IdmUser {
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
  const commaSeparatedRoles = requireAttribute("custom:roles", id);
  const roles = CommaSeparatedArray(UserRole).safeParse(commaSeparatedRoles);

  if (!roles.success) {
    throw genericInternalError(
      `User ${id} has invalid role claims: ${commaSeparatedRoles}`,
    );
  }

  if (roles.data.length === 0)
    throw genericInternalError(`User ${id} is missing required roles`);

  const username = user.Username;
  if (!username)
    throw genericInternalError(`User ${id} is missing required username`);

  return {
    email,
    id: unsafeBrandUserId(id),
    roles: roles.data,
    username,
  };
}
