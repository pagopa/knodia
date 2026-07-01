/* eslint-disable max-lines-per-function */
import type { UserRole } from "@knodia/common-models/auth";
import type { OrganizationId, UserId } from "@knodia/common-models/ids";

import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminListGroupsForUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  CreateGroupCommand,
  ListUsersCommand,
  ListUsersInGroupCommand,
  UserNotFoundException,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { randomBytes } from "node:crypto";
import { match } from "ts-pattern";

import type { CognitoIdmClientConfig } from "./config.ts";
import type { IdmUser } from "./models.ts";

import { toIdmUser } from "./converters.ts";

export type CognitoIdmClient = ReturnType<typeof buildCognitoIdmClient>;

export function buildCognitoIdmClient({
  cognitoUserPoolId,
}: CognitoIdmClientConfig) {
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

    async createOrganizationUser(input: {
      email: string;
      familyName: string;
      givenName: string;
      organizationId: OrganizationId;
      roles: UserRole[];
      username: string;
    }): Promise<void> {
      const groupName = getOrganizationGroupName(input.organizationId);

      await swallowCognitoError("GroupExistsException", () =>
        client.send(
          new CreateGroupCommand({
            GroupName: groupName,
            UserPoolId: cognitoUserPoolId,
          }),
        ),
      );

      // Idempotent on redelivery: the username is unique per signup user, so an
      // existing one is a prior attempt for the same user.
      await swallowCognitoError("UsernameExistsException", () =>
        client.send(
          new AdminCreateUserCommand({
            DesiredDeliveryMediums: ["EMAIL"],
            UserAttributes: [
              { Name: "email", Value: input.email },
              { Name: "email_verified", Value: "true" },
              { Name: "given_name", Value: input.givenName },
              { Name: "family_name", Value: input.familyName },
              { Name: "custom:roles", Value: input.roles.join(",") },
            ],
            Username: input.username,
            UserPoolId: cognitoUserPoolId,
          }),
        ),
      );

      await client.send(
        new AdminAddUserToGroupCommand({
          GroupName: groupName,
          Username: input.username,
          UserPoolId: cognitoUserPoolId,
        }),
      );
    },

    async deleteOrganizationUser(input: { username: string }): Promise<void> {
      // Idempotent for Kafka replays: a user already removed by a prior attempt
      // makes AdminDeleteUser raise UserNotFoundException, which we swallow.
      await swallowCognitoError("UserNotFoundException", () =>
        client.send(
          new AdminDeleteUserCommand({
            Username: input.username,
            UserPoolId: cognitoUserPoolId,
          }),
        ),
      );
    },

    async disableUser(input: { username: string }): Promise<void> {
      await client.send(
        new AdminDisableUserCommand({
          Username: input.username,
          UserPoolId: cognitoUserPoolId,
        }),
      );
    },

    async enableUser(input: { username: string }): Promise<void> {
      await client.send(
        new AdminEnableUserCommand({
          Username: input.username,
          UserPoolId: cognitoUserPoolId,
        }),
      );
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

    async getUserByUsername(username: string): Promise<IdmUser | undefined> {
      try {
        const user = await client.send(
          new AdminGetUserCommand({
            Username: username,
            UserPoolId: cognitoUserPoolId,
          }),
        );

        return toIdmUser(user);
      } catch (error) {
        if (error instanceof UserNotFoundException) {
          return undefined;
        }
        throw error;
      }
    },

    async resetUserCredentials(input: { username: string }): Promise<void> {
      // User deleted before a Kafka redelivery: nothing to reset, so don't stall the partition.
      await swallowCognitoError("UserNotFoundException", async () => {
        // Point read (immediately consistent), unlike getUserById's ListUsers index.
        const { UserStatus } = await client.send(
          new AdminGetUserCommand({
            Username: input.username,
            UserPoolId: cognitoUserPoolId,
          }),
        );

        await match(UserStatus)
          // Never logged in: RESEND directly. Swallow NotAuthorizedException for a disabled/suspended user.
          .with("FORCE_CHANGE_PASSWORD", () =>
            swallowCognitoError("NotAuthorizedException", () =>
              client.send(
                new AdminCreateUserCommand({
                  MessageAction: "RESEND",
                  Username: input.username,
                  UserPoolId: cognitoUserPoolId,
                }),
              ),
            ),
          )
          // RESEND only works on FORCE_CHANGE_PASSWORD: flip the user there with a throwaway
          // temporary password, then let Cognito generate and email a fresh one via RESEND.
          // Swallow NotAuthorizedException for non-resettable/disabled users; other errors are
          // transient (throttling, 5xx), so let them propagate and Kafka retries.
          .with(
            "CONFIRMED",
            "RESET_REQUIRED",
            "ARCHIVED",
            "COMPROMISED",
            "UNCONFIRMED",
            "EXTERNAL_PROVIDER",
            "UNKNOWN",
            undefined,
            () =>
              swallowCognitoError("NotAuthorizedException", async () => {
                await client.send(
                  new AdminSetUserPasswordCommand({
                    Password: generateTemporaryPassword(),
                    Permanent: false,
                    Username: input.username,
                    UserPoolId: cognitoUserPoolId,
                  }),
                );
                await client.send(
                  new AdminCreateUserCommand({
                    MessageAction: "RESEND",
                    Username: input.username,
                    UserPoolId: cognitoUserPoolId,
                  }),
                );
              }),
          )
          .exhaustive();
      });
    },

    async updateUserEmail(input: {
      email: string;
      username: string;
    }): Promise<void> {
      await client.send(
        new AdminUpdateUserAttributesCommand({
          UserAttributes: [
            { Name: "email", Value: input.email },
            { Name: "email_verified", Value: "true" },
          ],
          Username: input.username,
          UserPoolId: cognitoUserPoolId,
        }),
      );
    },
  };
}

// Throwaway password: RESEND replaces it immediately and the user never sees it, so it only
// has to satisfy the pool policy. The base64url suffix guarantees upper/lower/digit/symbol.
function generateTemporaryPassword(): string {
  return `${randomBytes(24).toString("base64url")}Aa1!`;
}

function getOrganizationGroupName(organizationId: OrganizationId) {
  return `org:${organizationId}`;
}

async function swallowCognitoError(
  exceptionName: string,
  operation: () => Promise<unknown>,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    if (error instanceof Error && error.name === exceptionName) {
      return;
    }
    throw error;
  }
}
