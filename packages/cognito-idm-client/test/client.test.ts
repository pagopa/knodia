import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
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

describe("resetUserCredentials", () => {
  it("flips an established user to FORCE_CHANGE_PASSWORD then resends via RESEND", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockResolvedValueOnce({ UserStatus: "CONFIRMED" } as never)
      .mockResolvedValue(undefined as never);

    await buildCognitoIdmClient({ cognitoUserPoolId }).resetUserCredentials({
      username: "mario.rossi",
    });

    expect(send).toHaveBeenCalledTimes(3);

    const getUser = send.mock.calls.at(0)?.at(0) as AdminGetUserCommand;
    expect(getUser).toBeInstanceOf(AdminGetUserCommand);

    const setPassword = send.mock.calls
      .at(1)
      ?.at(0) as AdminSetUserPasswordCommand;
    expect(setPassword).toBeInstanceOf(AdminSetUserPasswordCommand);
    expect(setPassword.input).toMatchObject({
      Permanent: false,
      Username: "mario.rossi",
      UserPoolId: cognitoUserPoolId,
    });

    const resend = send.mock.calls.at(2)?.at(0) as AdminCreateUserCommand;
    expect(resend).toBeInstanceOf(AdminCreateUserCommand);
    expect(resend.input).toMatchObject({
      MessageAction: "RESEND",
      Username: "mario.rossi",
      UserPoolId: cognitoUserPoolId,
    });
  });

  it("resends the temporary credentials of a user that never logged in", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockResolvedValueOnce({ UserStatus: "FORCE_CHANGE_PASSWORD" } as never)
      .mockResolvedValue(undefined as never);

    await buildCognitoIdmClient({ cognitoUserPoolId }).resetUserCredentials({
      username: "mario.rossi",
    });

    expect(send).toHaveBeenCalledTimes(2);

    const resend = send.mock.calls.at(1)?.at(0) as AdminCreateUserCommand;
    expect(resend).toBeInstanceOf(AdminCreateUserCommand);
    expect(resend.input).toMatchObject({
      MessageAction: "RESEND",
      Username: "mario.rossi",
      UserPoolId: cognitoUserPoolId,
    });
  });

  it("swallows NotAuthorizedException when the user is not in a resettable state", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockResolvedValueOnce({ UserStatus: "CONFIRMED" } as never)
      .mockRejectedValue(
        Object.assign(new Error("cannot reset"), {
          name: "NotAuthorizedException",
        }),
      );

    await expect(
      buildCognitoIdmClient({ cognitoUserPoolId }).resetUserCredentials({
        username: "mario.rossi",
      }),
    ).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledTimes(2);
  });

  it("flips a RESET_REQUIRED user to FORCE_CHANGE_PASSWORD then resends via RESEND", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockResolvedValueOnce({ UserStatus: "RESET_REQUIRED" } as never)
      .mockResolvedValue(undefined as never);

    await buildCognitoIdmClient({ cognitoUserPoolId }).resetUserCredentials({
      username: "mario.rossi",
    });

    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls.at(1)?.at(0)).toBeInstanceOf(
      AdminSetUserPasswordCommand,
    );
    expect(send.mock.calls.at(2)?.at(0)).toBeInstanceOf(AdminCreateUserCommand);
  });

  it("swallows UserNotFoundException when the user no longer exists", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockRejectedValue(
        Object.assign(new Error("user gone"), {
          name: "UserNotFoundException",
        }),
      );

    await expect(
      buildCognitoIdmClient({ cognitoUserPoolId }).resetUserCredentials({
        username: "mario.rossi",
      }),
    ).resolves.toBeUndefined();

    // AdminGetUser throws and is swallowed; no reset/resend is attempted.
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("deleteOrganizationUser", () => {
  it("deletes the user by username via AdminDeleteUser", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockResolvedValue(undefined as never);
    await buildCognitoIdmClient({ cognitoUserPoolId }).deleteOrganizationUser({
      username: "mario.rossi",
    });

    expect(send).toHaveBeenCalledTimes(1);
    const deleteCall = send.mock.calls.at(0)?.at(0) as AdminDeleteUserCommand;
    expect(deleteCall).toBeInstanceOf(AdminDeleteUserCommand);
    expect(deleteCall.input).toMatchObject({
      Username: "mario.rossi",
      UserPoolId: cognitoUserPoolId,
    });
  });
});

describe("disableUser", () => {
  it("disables the Cognito user", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockResolvedValue(undefined as never);

    await buildCognitoIdmClient({ cognitoUserPoolId }).disableUser({
      username: "mario.rossi",
    });

    expect(send).toHaveBeenCalledOnce();

    const [disableCall] = send.mock.calls;
    if (!disableCall) {
      throw new Error("expected disableUser to issue one command");
    }

    const disableUser = disableCall.at(0) as AdminDisableUserCommand;
    expect(disableUser).toBeInstanceOf(AdminDisableUserCommand);
    expect(disableUser.input).toMatchObject({
      Username: "mario.rossi",
      UserPoolId: cognitoUserPoolId,
    });
  });

  it("is idempotent: swallows UserNotFoundException", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockRejectedValue(
        Object.assign(new Error("user not found"), {
          name: "UserNotFoundException",
        }),
      );

    await expect(
      buildCognitoIdmClient({ cognitoUserPoolId }).deleteOrganizationUser({
        username: "u",
      }),
    ).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledTimes(1);
  });

  it("rethrows non-ignored errors", async () => {
    vi.spyOn(CognitoIdentityProviderClient.prototype, "send").mockRejectedValue(
      Object.assign(new Error("boom"), { name: "InternalErrorException" }),
    );

    await expect(
      buildCognitoIdmClient({ cognitoUserPoolId }).deleteOrganizationUser({
        username: "u",
      }),
    ).rejects.toThrow("boom");
  });
});

describe("enableUser", () => {
  it("enables the Cognito user", async () => {
    const send = vi
      .spyOn(CognitoIdentityProviderClient.prototype, "send")
      .mockResolvedValue(undefined as never);

    await buildCognitoIdmClient({ cognitoUserPoolId }).enableUser({
      username: "mario.rossi",
    });

    expect(send).toHaveBeenCalledOnce();

    const [enableCall] = send.mock.calls;
    if (!enableCall) {
      throw new Error("expected enableUser to issue one command");
    }

    const enableUser = enableCall.at(0) as AdminEnableUserCommand;
    expect(enableUser).toBeInstanceOf(AdminEnableUserCommand);
    expect(enableUser.input).toMatchObject({
      Username: "mario.rossi",
      UserPoolId: cognitoUserPoolId,
    });
  });

  it("rethrows non-ignored errors", async () => {
    vi.spyOn(CognitoIdentityProviderClient.prototype, "send").mockRejectedValue(
      Object.assign(new Error("boom"), { name: "InternalErrorException" }),
    );

    await expect(
      buildCognitoIdmClient({ cognitoUserPoolId }).enableUser({
        username: "u",
      }),
    ).rejects.toThrow("boom");
  });
});
