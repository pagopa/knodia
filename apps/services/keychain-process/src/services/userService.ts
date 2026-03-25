import {
  AdminListGroupsForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { genericInternalError } from "@knodia/common-models/errors";
import {
  type OrganizationId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";

export type UserService = ReturnType<typeof userServiceBuilder>;

const TECHNICAL_ROLE_GROUP_NAME = "role:technical";
const getOrganizationGroupName = (organizationId: OrganizationId) =>
  `org:${organizationId}`;

export interface IdmUser {
  email: string;
  id: UserId;
  username: string;
}

export function userServiceBuilder({ userPoolId }: { userPoolId: string }) {
  const client = new CognitoIdentityProviderClient();

  async function listUsersInGroup(groupName: string): Promise<IdmUser[]> {
    const users: UserType[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new ListUsersInGroupCommand({
          GroupName: groupName,
          Limit: 60, // Max limit per AWS docs
          NextToken: nextToken,
          UserPoolId: userPoolId,
        }),
      );

      users.push(...(response.Users ?? []));
      nextToken = response.NextToken;
    } while (nextToken);

    return users.map(toIdmUser);
  }

  async function getUserById(userId: UserId): Promise<IdmUser | undefined> {
    const reponse = await client.send(
      new ListUsersCommand({
        Filter: `sub = "${userId}"`,
        Limit: 1,
        UserPoolId: userPoolId,
      }),
    );

    const user = reponse.Users?.[0];
    return user ? toIdmUser(user) : undefined;
  }

  async function listGroupsForUser(username: string): Promise<string[]> {
    const groups: string[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new AdminListGroupsForUserCommand({
          Limit: 60, // Max limit per AWS docs
          NextToken: nextToken,
          Username: username,
          UserPoolId: userPoolId,
        }),
      );

      groups.push(
        ...(response.Groups ?? []).flatMap((group) =>
          group.GroupName ? [group.GroupName] : [],
        ),
      );
      nextToken = response.NextToken;
    } while (nextToken);

    return groups;
  }

  return {
    async getOrganizationTechnicalUser(
      organizationId: OrganizationId,
      userId: UserId,
    ): Promise<IdmUser | undefined> {
      const user = await getUserById(userId);
      if (!user) {
        return undefined;
      }

      const groups = await listGroupsForUser(user.username);

      const isTechnicalUser = groups.includes(TECHNICAL_ROLE_GROUP_NAME);
      const isOrgMember = groups.includes(
        getOrganizationGroupName(organizationId),
      );

      return isTechnicalUser && isOrgMember ? user : undefined;
    },

    async getOrganizationTechnicalUsers(
      organizationId: OrganizationId,
    ): Promise<IdmUser[]> {
      const organizationUsers = await listUsersInGroup(
        getOrganizationGroupName(organizationId),
      );
      const technicalUsers = await listUsersInGroup(TECHNICAL_ROLE_GROUP_NAME);

      const technicalUserIds = new Set(technicalUsers.map((user) => user.id));

      return organizationUsers.filter((user) => technicalUserIds.has(user.id));
    },
  };
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

  const username = user.Username;
  if (!username)
    throw genericInternalError(`User ${id} is missing required username`);

  return {
    email,
    id: unsafeBrandUserId(id),
    username,
  };
}
