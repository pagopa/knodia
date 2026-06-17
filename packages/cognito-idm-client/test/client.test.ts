import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  CreateGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { UserRole } from "@knodia/common-models/auth";
import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildCognitoIdmClient } from "../src/client.ts";

const cognitoUserPoolId = "test-pool";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createOrganizationUser", () => {
  it("creates the group, the user, and the membership in order", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockResolvedValue(undefined as never);
    const organizationId = generateId<OrganizationId>();

    await buildCognitoIdmClient({ cognitoUserPoolId }).createOrganizationUser({
      email: "mario.rossi@example.org",
      familyName: "Rossi",
      givenName: "Mario",
      organizationId,
      roles: [UserRole.enum.administrative, UserRole.enum.technical],
      username: "mario.rossi",
    });

    expect(send).toHaveBeenCalledTimes(3);

    const [groupCall, userCall, membershipCall] = send.mock.calls;
    if (!groupCall || !userCall || !membershipCall) {
      throw new Error(
        "expected createOrganizationUser to issue three commands",
      );
    }

    const createGroup = groupCall.at(0) as CreateGroupCommand;
    expect(createGroup).toBeInstanceOf(CreateGroupCommand);
    expect(createGroup.input).toMatchObject({
      GroupName: `org:${organizationId}`,
      UserPoolId: cognitoUserPoolId,
    });

    const createUser = userCall.at(0) as AdminCreateUserCommand;
    expect(createUser).toBeInstanceOf(AdminCreateUserCommand);
    expect(createUser.input).toMatchObject({
      DesiredDeliveryMediums: ["EMAIL"],
      Username: "mario.rossi",
      UserPoolId: cognitoUserPoolId,
    });
    expect(createUser.input.UserAttributes).toEqual(
      expect.arrayContaining([
        { Name: "custom:roles", Value: "administrative,technical" },
      ]),
    );

    const addToGroup = membershipCall.at(0) as AdminAddUserToGroupCommand;
    expect(addToGroup).toBeInstanceOf(AdminAddUserToGroupCommand);
    expect(addToGroup.input).toMatchObject({
      GroupName: `org:${organizationId}`,
      Username: "mario.rossi",
    });
  });

  it("is idempotent: swallows GroupExists and UsernameExists", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockRejectedValueOnce(
        Object.assign(new Error("group exists"), {
          name: "GroupExistsException",
        }),
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("user exists"), {
          name: "UsernameExistsException",
        }),
      )
      .mockResolvedValueOnce(undefined as never);

    await expect(
      buildCognitoIdmClient({ cognitoUserPoolId }).createOrganizationUser({
        email: "a@b.co",
        familyName: "F",
        givenName: "G",
        organizationId: generateId<OrganizationId>(),
        roles: [UserRole.enum.technical],
        username: "u",
      }),
    ).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledTimes(3);
  });

  it("rethrows non-ignored errors", async () => {
    vi.spyOn(CognitoIdentityProviderClient.prototype, "send").mockRejectedValue(
      Object.assign(new Error("boom"), { name: "InternalErrorException" }),
    );

    await expect(
      buildCognitoIdmClient({ cognitoUserPoolId }).createOrganizationUser({
        email: "a@b.co",
        familyName: "F",
        givenName: "G",
        organizationId: generateId<OrganizationId>(),
        roles: [UserRole.enum.technical],
        username: "u",
      }),
    ).rejects.toThrow("boom");
  });
});

describe("updateUserEmail", () => {
  it("updates the user email and marks it as verified", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockResolvedValue(undefined as never);

    await buildCognitoIdmClient({ cognitoUserPoolId }).updateUserEmail({
      email: "new.email@example.org",
      username: "mario.rossi",
    });

    expect(send).toHaveBeenCalledOnce();

    const [updateCall] = send.mock.calls;
    if (!updateCall) {
      throw new Error("expected updateUserEmail to issue one command");
    }

    const updateUser = updateCall.at(0) as AdminUpdateUserAttributesCommand;
    expect(updateUser).toBeInstanceOf(AdminUpdateUserAttributesCommand);
    expect(updateUser.input).toMatchObject({
      Username: "mario.rossi",
      UserPoolId: cognitoUserPoolId,
    });
    expect(updateUser.input.UserAttributes).toEqual([
      { Name: "email", Value: "new.email@example.org" },
      { Name: "email_verified", Value: "true" },
    ]);
  });
});
