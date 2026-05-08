import type { OrganizationId, UserId } from "@knodia/common-models/ids";

import {
  AdminListGroupsForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";

import type { IdmClientConfig } from "./config.js";
import type { IdmUser } from "./models.js";

import { toIdmUser } from "./converters.js";

export type IdmClient = ReturnType<typeof createIdmClient>;

export function createIdmClient({ cognitoUserPoolId }: IdmClientConfig) {
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
            UserPoolId: cognitoUserPoolId,
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
            UserPoolId: cognitoUserPoolId,
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
          UserPoolId: cognitoUserPoolId,
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
