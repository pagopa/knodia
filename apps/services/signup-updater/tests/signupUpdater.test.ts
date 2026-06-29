/* eslint-disable max-lines-per-function */
import type { Logger } from "pino";

import {
  type CorrelationId,
  type EmailChangeRequestId,
  generateId,
  type OrganizationId,
  type SignupUserId,
} from "@knodia/common-models/ids";
import { PG_UNIQUE_VIOLATION } from "@knodia/common-models/pgErrorCodes";
import {
  DeletionRequestedV1,
  type EmailChangeRequest,
  type EmailChangeRequestedV1,
  OnboardingCompletedV1,
  type SignupEventV1,
  SignupUser,
  SignupUserStatus,
} from "@knodia/signup-models";
import { DrizzleQueryError } from "drizzle-orm";
import { DatabaseError } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zocker } from "zocker";

const createOrganizationMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/organization-process-client", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@knodia/organization-process-client")
    >();
  return {
    ...original,
    organizationProcessApi: {
      ...original.organizationProcessApi,
      createOrganization: createOrganizationMock,
    },
  };
});

import { match } from "ts-pattern";

import type { SignupUpdaterDeps } from "../src/utils/utils.ts";

import { handleSignupMessage } from "../src/services/consumerService.ts";
import { externalOrganizationId } from "../src/utils/externalOrganizationId.ts";

const cognitoCreateUserMock = vi.fn();
const cognitoDisableUserMock = vi.fn();
const cognitoUpdateUserEmailMock = vi.fn();
const cognitoResetUserCredentialsMock = vi.fn();
const deleteEmailChangeRequestMock = vi.fn();
const getEmailChangeRequestByIdMock = vi.fn();
const updateSignupUserEmailMock = vi.fn();
const cognitoDeleteUserMock = vi.fn();
const getSignupUserByIdMock = vi.fn();
const getSignupUserDeletionMock = vi.fn();
const completeSignupUserDeletionMock = vi.fn();

const correlationId = generateId<CorrelationId>();
const logger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
} as unknown as Logger;

function buildDeps(): SignupUpdaterDeps {
  const node = {
    cognitoClient: {
      createOrganizationUser: cognitoCreateUserMock,
      deleteOrganizationUser: cognitoDeleteUserMock,
      disableUser: cognitoDisableUserMock,
      resetUserCredentials: cognitoResetUserCredentialsMock,
      updateUserEmail: cognitoUpdateUserEmailMock,
    },
    internalTokenProvider: {
      get: vi.fn().mockResolvedValue({ serialized: "mock-internal-token" }),
    },
    orgClient: {},
  };
  return {
    knodeClients: { Lynx: node, Orion: node },
    signupDbService: {
      completeSignupUserDeletion: completeSignupUserDeletionMock,
      deleteEmailChangeRequest: deleteEmailChangeRequestMock,
      getEmailChangeRequestById: getEmailChangeRequestByIdMock,
      getSignupUserById: getSignupUserByIdMock,
      getSignupUserDeletion: getSignupUserDeletionMock,
      updateSignupUserEmail: updateSignupUserEmailMock,
    },
  } as unknown as SignupUpdaterDeps;
}

function deletionEvent(signupUserId: SignupUserId): DeletionRequestedV1 {
  const event = zocker(DeletionRequestedV1).setSeed(0).generate();
  // Pin the discriminant so a schema/seed change can't silently hand us a
  // different event variant than the one this helper is named for.
  expect(event.type).toBe("DeletionRequestedV1");
  return { ...event, data: { ...event.data, signupUserId } };
}

function emailChangeRequestedEvent({
  emailChangeRequestId,
  signupUserId,
}: {
  emailChangeRequestId: EmailChangeRequestId;
  signupUserId: SignupUserId;
}): EmailChangeRequestedV1 {
  return {
    data: { emailChangeRequestId, signupUserId },
    type: "EmailChangeRequestedV1",
  };
}

function getMockEmailChangeRequest(
  overrides: Partial<EmailChangeRequest> = {},
): EmailChangeRequest {
  return {
    createdAt: new Date("2026-05-28T10:00:00Z"),
    email: "new.email@example.org",
    emailChangeRequestId: generateId<EmailChangeRequestId>(),
    signupUserId: generateId<SignupUserId>(),
    ...overrides,
  };
}

function getMockSignupUser(overrides: Partial<SignupUser> = {}): SignupUser {
  const base = {
    ...zocker(SignupUser).setSeed(0).generate(),
    email: "mario.rossi@example.org",
    familyName: "Rossi",
    generatedEntities: {
      Lynx: {
        organizationName: "Rossi Org Lynx",
        userName: "mario.rossi.lynx",
      },
      Orion: {
        organizationName: "Rossi Org Orion",
        userName: "mario.rossi.orion",
      },
    },
    name: "Mario",
    signupUserId: generateId<SignupUserId>(),
    ...overrides,
  };

  return match(overrides.status ?? SignupUserStatus.enum.Active)
    .returnType<SignupUser>()
    .with(
      SignupUserStatus.enum.Active,
      SignupUserStatus.enum.DeletionPending,
      (status) => ({ ...base, status }),
    )
    .with(SignupUserStatus.enum.Suspended, (status) => ({
      ...base,
      status,
      suspendedAt: new Date(),
      suspensionReason: "DataNeededForLegalClaims",
    }))
    .exhaustive();
}

function maintenanceUserReactivationRequestedEvent(
  signupUserId: SignupUserId,
): Extract<SignupEventV1, { type: "MaintenanceUserReactivationRequestedV1" }> {
  return {
    data: {
      occurredAt: "2026-05-28T10:00:00.000Z",
      signupUserId,
    },
    type: "MaintenanceUserReactivationRequestedV1",
  };
}

function onboardingEvent(signupUserId: SignupUserId): OnboardingCompletedV1 {
  const event = zocker(OnboardingCompletedV1).setSeed(0).generate();
  // Pin the discriminant so a schema/seed change can't silently hand us a
  // different event variant than the one this helper is named for.
  expect(event.type).toBe("OnboardingCompletedV1");
  return { ...event, data: { ...event.data, signupUserId } };
}

function pgUniqueViolation(): DrizzleQueryError {
  const dbError = new DatabaseError(
    "duplicate key value violates unique constraint",
    0,
    "error",
  );
  dbError.code = PG_UNIQUE_VIOLATION;
  return new DrizzleQueryError("update signup_user", [], dbError);
}

function suspensionRequestedEvent(
  signupUserId: SignupUserId,
): Extract<SignupEventV1, { type: "SuspensionRequestedV1" }> {
  return {
    data: {
      occurredAt: "2026-05-28T10:00:00.000Z",
      oneIdNonce: "nonce-1",
      signupUserId,
      suspensionReason: "UnlawfulProcessing",
    },
    type: "SuspensionRequestedV1",
  };
}

const conflict = { isAxiosError: true, response: { status: 409 } };

describe("handleSignupMessage — OnboardingCompletedV1", () => {
  beforeEach(() => {
    createOrganizationMock.mockReset();
    cognitoCreateUserMock.mockReset();
    cognitoDisableUserMock.mockReset();
    cognitoUpdateUserEmailMock.mockReset();
    cognitoResetUserCredentialsMock.mockReset();
    deleteEmailChangeRequestMock.mockReset();
    getEmailChangeRequestByIdMock.mockReset();
    getSignupUserByIdMock.mockReset();
    updateSignupUserEmailMock.mockReset();
    getSignupUserDeletionMock.mockReset();
    vi.mocked(logger.error).mockReset();
    vi.mocked(logger.info).mockReset();
    vi.mocked(logger.warn).mockReset();
  });

  it("creates an org (with the testing_organization attribute) and a Cognito user on both nodes", async () => {
    const user = getMockSignupUser();
    const orionOrgId = generateId<OrganizationId>();
    const lynxOrgId = generateId<OrganizationId>();
    getSignupUserByIdMock.mockResolvedValue(user);
    createOrganizationMock
      .mockResolvedValueOnce({ data: { id: orionOrgId } })
      .mockResolvedValueOnce({ data: { id: lynxOrgId } });

    await handleSignupMessage(
      onboardingEvent(user.signupUserId),
      buildDeps(),
      correlationId,
      logger,
    );

    expect(createOrganizationMock).toHaveBeenCalledTimes(2);
    // KnodeId.options is ["Orion", "Lynx"], so the first call is Orion.
    const orionCall = createOrganizationMock.mock.calls.at(0)?.at(0);
    expect(orionCall?.body).toEqual({
      attributes: [
        { code: "testing_organization", scheme: "knodia" },
        { code: "Rossi Org Orion", scheme: "Orion" },
      ],
      externalOrganizationId: externalOrganizationId(
        user.signupUserId,
        "Orion",
      ),
      name: "Rossi Org Orion",
    });
    expect(orionCall?.headers.authorization).toBe("Bearer mock-internal-token");

    const lynxCall = createOrganizationMock.mock.calls.at(1)?.at(0);
    expect(lynxCall?.body).toEqual({
      attributes: [
        { code: "testing_organization", scheme: "knodia" },
        { code: "Rossi Org Lynx", scheme: "Lynx" },
      ],
      externalOrganizationId: externalOrganizationId(user.signupUserId, "Lynx"),
      name: "Rossi Org Lynx",
    });

    expect(cognitoCreateUserMock).toHaveBeenCalledTimes(2);
    expect(cognitoCreateUserMock.mock.calls.at(0)?.at(0)).toMatchObject({
      email: "mario.rossi@example.org",
      familyName: "Rossi",
      givenName: "Mario",
      organizationId: orionOrgId,
      roles: ["administrative", "technical"],
      username: "mario.rossi.orion",
    });
    expect(cognitoCreateUserMock.mock.calls.at(1)?.at(0)).toMatchObject({
      organizationId: lynxOrgId,
      username: "mario.rossi.lynx",
    });
  });

  it("skips the node and logs on a 409 (name taken by another org) instead of throwing, so the partition isn't blocked", async () => {
    getSignupUserByIdMock.mockResolvedValue(getMockSignupUser());
    createOrganizationMock.mockRejectedValue(conflict);

    await expect(
      handleSignupMessage(
        onboardingEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    // No Cognito user is created without an org, and both nodes are skipped
    // (the offset commits) rather than blocking the partition.
    expect(cognitoCreateUserMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(2);
  });

  it("skips only the node that returns a 409 and still provisions the others", async () => {
    getSignupUserByIdMock.mockResolvedValue(getMockSignupUser());
    createOrganizationMock
      .mockResolvedValueOnce({ data: { id: generateId<OrganizationId>() } })
      .mockRejectedValueOnce(conflict);

    await expect(
      handleSignupMessage(
        onboardingEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    // Orion is fully provisioned; Lynx's 409 is skipped without aborting.
    expect(createOrganizationMock).toHaveBeenCalledTimes(2);
    expect(cognitoCreateUserMock).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it("rethrows a non-409 error so the message is redelivered", async () => {
    getSignupUserByIdMock.mockResolvedValue(getMockSignupUser());
    createOrganizationMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500 },
    });

    await expect(
      handleSignupMessage(
        onboardingEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).rejects.toBeDefined();

    expect(cognitoCreateUserMock).not.toHaveBeenCalled();
  });

  it("skips (without throwing) when the user is gone and a deletion record confirms it, provisioning nothing", async () => {
    getSignupUserByIdMock.mockResolvedValue(undefined);
    getSignupUserDeletionMock.mockResolvedValue({
      deletedAt: new Date(),
      signupUserId: generateId<SignupUserId>(),
    });

    await expect(
      handleSignupMessage(
        onboardingEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    // The deletion registry confirms the row is gone by design, so the event is
    // skipped (the offset commits) with a warning rather than blocking the partition.
    expect(createOrganizationMock).not.toHaveBeenCalled();
    expect(cognitoCreateUserMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it("throws (so the message is redelivered) when the user is gone but no deletion record exists", async () => {
    getSignupUserByIdMock.mockResolvedValue(undefined);
    getSignupUserDeletionMock.mockResolvedValue(undefined);

    await expect(
      handleSignupMessage(
        onboardingEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).rejects.toThrow();

    // No deletion record means the disappearance is unexpected, so we don't
    // silently drop the event: provision nothing and let the partition retry.
    expect(createOrganizationMock).not.toHaveBeenCalled();
    expect(cognitoCreateUserMock).not.toHaveBeenCalled();
  });
});

describe("handleSignupMessage — EmailChangeRequestedV1", () => {
  beforeEach(() => {
    createOrganizationMock.mockReset();
    cognitoCreateUserMock.mockReset();
    cognitoDisableUserMock.mockReset();
    cognitoUpdateUserEmailMock.mockReset();
    cognitoResetUserCredentialsMock.mockReset();
    deleteEmailChangeRequestMock.mockReset();
    getEmailChangeRequestByIdMock.mockReset();
    getSignupUserByIdMock.mockReset();
    updateSignupUserEmailMock.mockReset();
    vi.mocked(logger.error).mockReset();
    vi.mocked(logger.info).mockReset();
    vi.mocked(logger.warn).mockReset();
  });

  it("updates the email, updates Cognito and resets credentials on both nodes, and deletes the request", async () => {
    const user = getMockSignupUser();
    const emailChangeRequestId = generateId<EmailChangeRequestId>();
    const request = getMockEmailChangeRequest({
      emailChangeRequestId,
      signupUserId: user.signupUserId,
    });
    getEmailChangeRequestByIdMock.mockResolvedValue(request);
    getSignupUserByIdMock.mockResolvedValue(user);
    updateSignupUserEmailMock.mockResolvedValue(undefined);
    cognitoUpdateUserEmailMock.mockResolvedValue(undefined);
    cognitoResetUserCredentialsMock.mockResolvedValue(undefined);
    deleteEmailChangeRequestMock.mockResolvedValue(undefined);

    await handleSignupMessage(
      emailChangeRequestedEvent({
        emailChangeRequestId,
        signupUserId: user.signupUserId,
      }),
      buildDeps(),
      correlationId,
      logger,
    );

    expect(getEmailChangeRequestByIdMock).toHaveBeenCalledWith(
      emailChangeRequestId,
    );
    expect(updateSignupUserEmailMock).toHaveBeenCalledWith({
      email: request.email,
      signupUserId: user.signupUserId,
    });
    expect(cognitoUpdateUserEmailMock).toHaveBeenCalledTimes(2);
    expect(cognitoUpdateUserEmailMock.mock.calls.at(0)?.at(0)).toEqual({
      email: request.email,
      username: "mario.rossi.orion",
    });
    expect(cognitoUpdateUserEmailMock.mock.calls.at(1)?.at(0)).toEqual({
      email: request.email,
      username: "mario.rossi.lynx",
    });
    expect(cognitoResetUserCredentialsMock).toHaveBeenCalledTimes(2);
    expect(cognitoResetUserCredentialsMock).toHaveBeenCalledWith({
      username: "mario.rossi.orion",
    });
    expect(cognitoResetUserCredentialsMock).toHaveBeenCalledWith({
      username: "mario.rossi.lynx",
    });
    expect(deleteEmailChangeRequestMock).toHaveBeenCalledWith(
      emailChangeRequestId,
    );
  });

  it("skips the event when the email change request no longer exists", async () => {
    const signupUserId = generateId<SignupUserId>();
    const emailChangeRequestId = generateId<EmailChangeRequestId>();
    getEmailChangeRequestByIdMock.mockResolvedValue(undefined);

    await expect(
      handleSignupMessage(
        emailChangeRequestedEvent({ emailChangeRequestId, signupUserId }),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    expect(getSignupUserByIdMock).not.toHaveBeenCalled();
    expect(updateSignupUserEmailMock).not.toHaveBeenCalled();
    expect(cognitoUpdateUserEmailMock).not.toHaveBeenCalled();
    expect(deleteEmailChangeRequestMock).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it("deletes the request and skips the event when the signup user no longer exists", async () => {
    const signupUserId = generateId<SignupUserId>();
    const emailChangeRequestId = generateId<EmailChangeRequestId>();
    const request = getMockEmailChangeRequest({
      emailChangeRequestId,
      signupUserId,
    });
    getEmailChangeRequestByIdMock.mockResolvedValue(request);
    getSignupUserByIdMock.mockResolvedValue(undefined);
    getSignupUserDeletionMock.mockResolvedValue({
      deletedAt: new Date("2026-05-28T10:00:00.000Z"),
      signupUserId,
    });
    deleteEmailChangeRequestMock.mockResolvedValue(undefined);

    await expect(
      handleSignupMessage(
        emailChangeRequestedEvent({
          emailChangeRequestId,
          signupUserId,
        }),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    expect(updateSignupUserEmailMock).not.toHaveBeenCalled();
    expect(cognitoUpdateUserEmailMock).not.toHaveBeenCalled();
    expect(deleteEmailChangeRequestMock).toHaveBeenCalledWith(
      emailChangeRequestId,
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it("throws and keeps the request pending on a signup user email unique violation", async () => {
    const user = getMockSignupUser();
    const emailChangeRequestId = generateId<EmailChangeRequestId>();
    const request = getMockEmailChangeRequest({
      emailChangeRequestId,
      signupUserId: user.signupUserId,
    });
    getEmailChangeRequestByIdMock.mockResolvedValue(request);
    getSignupUserByIdMock.mockResolvedValue(user);
    updateSignupUserEmailMock.mockRejectedValue(pgUniqueViolation());

    await expect(
      handleSignupMessage(
        emailChangeRequestedEvent({
          emailChangeRequestId,
          signupUserId: user.signupUserId,
        }),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).rejects.toMatchObject({ code: "GENERIC_INTERNAL_ERROR" });

    expect(cognitoUpdateUserEmailMock).not.toHaveBeenCalled();
    expect(deleteEmailChangeRequestMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it("throws and keeps the request pending when a Cognito email update fails", async () => {
    const user = getMockSignupUser();
    const emailChangeRequestId = generateId<EmailChangeRequestId>();
    const request = getMockEmailChangeRequest({
      emailChangeRequestId,
      signupUserId: user.signupUserId,
    });
    getEmailChangeRequestByIdMock.mockResolvedValue(request);
    getSignupUserByIdMock.mockResolvedValue(user);
    updateSignupUserEmailMock.mockResolvedValue(undefined);
    cognitoUpdateUserEmailMock.mockRejectedValueOnce(new Error("boom"));

    await expect(
      handleSignupMessage(
        emailChangeRequestedEvent({
          emailChangeRequestId,
          signupUserId: user.signupUserId,
        }),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).rejects.toThrow("boom");

    expect(updateSignupUserEmailMock).toHaveBeenCalledWith({
      email: request.email,
      signupUserId: user.signupUserId,
    });
    expect(deleteEmailChangeRequestMock).not.toHaveBeenCalled();
  });

  it("throws and keeps the request pending when the credential reset fails", async () => {
    const user = getMockSignupUser();
    const emailChangeRequestId = generateId<EmailChangeRequestId>();
    const request = getMockEmailChangeRequest({
      emailChangeRequestId,
      signupUserId: user.signupUserId,
    });
    getEmailChangeRequestByIdMock.mockResolvedValue(request);
    getSignupUserByIdMock.mockResolvedValue(user);
    updateSignupUserEmailMock.mockResolvedValue(undefined);
    cognitoUpdateUserEmailMock.mockResolvedValue(undefined);
    cognitoResetUserCredentialsMock.mockRejectedValueOnce(new Error("boom"));

    await expect(
      handleSignupMessage(
        emailChangeRequestedEvent({
          emailChangeRequestId,
          signupUserId: user.signupUserId,
        }),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).rejects.toThrow("boom");

    expect(deleteEmailChangeRequestMock).not.toHaveBeenCalled();
  });
});

describe("handleSignupMessage — SuspensionRequestedV1", () => {
  beforeEach(() => {
    createOrganizationMock.mockReset();
    cognitoCreateUserMock.mockReset();
    cognitoDisableUserMock.mockReset();
    cognitoUpdateUserEmailMock.mockReset();
    cognitoResetUserCredentialsMock.mockReset();
    deleteEmailChangeRequestMock.mockReset();
    getEmailChangeRequestByIdMock.mockReset();
    getSignupUserByIdMock.mockReset();
    getSignupUserDeletionMock.mockReset();
    updateSignupUserEmailMock.mockReset();
    vi.mocked(logger.error).mockReset();
    vi.mocked(logger.info).mockReset();
    vi.mocked(logger.warn).mockReset();
  });

  it("disables the Cognito user on both knodes", async () => {
    const user = getMockSignupUser();
    getSignupUserByIdMock.mockResolvedValue(user);

    await handleSignupMessage(
      suspensionRequestedEvent(user.signupUserId),
      buildDeps(),
      correlationId,
      logger,
    );

    expect(cognitoDisableUserMock).toHaveBeenCalledTimes(2);
    expect(cognitoDisableUserMock.mock.calls.at(0)?.at(0)).toEqual({
      username: "mario.rossi.orion",
    });
    expect(cognitoDisableUserMock.mock.calls.at(1)?.at(0)).toEqual({
      username: "mario.rossi.lynx",
    });
  });

  it("skips (without throwing) when the signup user is not found and deletion record exists", async () => {
    getSignupUserByIdMock.mockResolvedValue(undefined);
    getSignupUserDeletionMock.mockResolvedValue({
      deletedAt: new Date("2026-05-28T10:00:00.000Z"),
      signupUserId: generateId<SignupUserId>(),
    });

    await expect(
      handleSignupMessage(
        suspensionRequestedEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    expect(cognitoDisableUserMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it("throws when disabling the user fails on one knode", async () => {
    const user = getMockSignupUser();
    getSignupUserByIdMock.mockResolvedValue(user);
    cognitoDisableUserMock.mockRejectedValueOnce(new Error("boom"));

    await expect(
      handleSignupMessage(
        suspensionRequestedEvent(user.signupUserId),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).rejects.toThrow("boom");
  });
});

describe("handleSignupMessage — MaintenanceUserReactivationRequestedV1", () => {
  const cognitoEnableUserMock = vi.fn();

  beforeEach(() => {
    createOrganizationMock.mockReset();
    cognitoCreateUserMock.mockReset();
    cognitoDisableUserMock.mockReset();
    cognitoEnableUserMock.mockReset();
    cognitoUpdateUserEmailMock.mockReset();
    deleteEmailChangeRequestMock.mockReset();
    getEmailChangeRequestByIdMock.mockReset();
    getSignupUserByIdMock.mockReset();
    getSignupUserDeletionMock.mockReset();
    updateSignupUserEmailMock.mockReset();
    vi.mocked(logger.error).mockReset();
    vi.mocked(logger.info).mockReset();
    vi.mocked(logger.warn).mockReset();
  });

  it("enables the Cognito user on both knodes", async () => {
    const user = getMockSignupUser();
    getSignupUserByIdMock.mockResolvedValue(user);

    const deps = buildDeps();
    deps.knodeClients.Lynx.cognitoClient.enableUser = cognitoEnableUserMock;
    deps.knodeClients.Orion.cognitoClient.enableUser = cognitoEnableUserMock;

    await handleSignupMessage(
      maintenanceUserReactivationRequestedEvent(user.signupUserId),
      deps,
      correlationId,
      logger,
    );

    expect(cognitoEnableUserMock).toHaveBeenCalledTimes(2);
    expect(cognitoEnableUserMock.mock.calls.at(0)?.at(0)).toEqual({
      username: "mario.rossi.orion",
    });
    expect(cognitoEnableUserMock.mock.calls.at(1)?.at(0)).toEqual({
      username: "mario.rossi.lynx",
    });
  });

  it("skips (without throwing) when the signup user is not found and deletion record exists", async () => {
    getSignupUserByIdMock.mockResolvedValue(undefined);
    getSignupUserDeletionMock.mockResolvedValue({
      deletedAt: new Date("2026-05-28T10:00:00.000Z"),
      signupUserId: generateId<SignupUserId>(),
    });

    const deps = buildDeps();
    deps.knodeClients.Lynx.cognitoClient.enableUser = cognitoEnableUserMock;
    deps.knodeClients.Orion.cognitoClient.enableUser = cognitoEnableUserMock;

    await expect(
      handleSignupMessage(
        maintenanceUserReactivationRequestedEvent(generateId<SignupUserId>()),
        deps,
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    expect(cognitoEnableUserMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it("throws when enabling the user fails on one knode", async () => {
    const user = getMockSignupUser();
    getSignupUserByIdMock.mockResolvedValue(user);
    cognitoEnableUserMock.mockRejectedValueOnce(new Error("boom"));

    const deps = buildDeps();
    deps.knodeClients.Lynx.cognitoClient.enableUser = cognitoEnableUserMock;
    deps.knodeClients.Orion.cognitoClient.enableUser = cognitoEnableUserMock;

    await expect(
      handleSignupMessage(
        maintenanceUserReactivationRequestedEvent(user.signupUserId),
        deps,
        correlationId,
        logger,
      ),
    ).rejects.toThrow("boom");
  });
});

describe("handleSignupMessage — DeletionRequestedV1", () => {
  beforeEach(() => {
    cognitoDeleteUserMock.mockReset();
    getSignupUserByIdMock.mockReset();
    getSignupUserDeletionMock.mockReset();
    completeSignupUserDeletionMock.mockReset();
    vi.mocked(logger.error).mockReset();
    vi.mocked(logger.warn).mockReset();
  });

  it("deletes the Cognito user on both nodes (leaving the orgs), then completes the deletion", async () => {
    const user = getMockSignupUser({
      status: SignupUserStatus.enum.DeletionPending,
    });
    getSignupUserByIdMock.mockResolvedValue(user);

    await handleSignupMessage(
      deletionEvent(user.signupUserId),
      buildDeps(),
      correlationId,
      logger,
    );

    expect(cognitoDeleteUserMock).toHaveBeenCalledTimes(2);
    // KnodeId.options is ["Orion", "Lynx"], so the first call is Orion.
    expect(cognitoDeleteUserMock.mock.calls.at(0)?.at(0)).toEqual({
      username: "mario.rossi.orion",
    });
    expect(cognitoDeleteUserMock.mock.calls.at(1)?.at(0)).toEqual({
      username: "mario.rossi.lynx",
    });

    expect(completeSignupUserDeletionMock).toHaveBeenCalledTimes(1);
    expect(completeSignupUserDeletionMock).toHaveBeenCalledWith(
      user.signupUserId,
    );
  });

  it("skips (logs and commits) when the user is not in DeletionPending status, deleting nothing", async () => {
    getSignupUserByIdMock.mockResolvedValue(
      getMockSignupUser({ status: SignupUserStatus.enum.Active }),
    );

    await expect(
      handleSignupMessage(
        deletionEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    // A user not marked for deletion must not have its Cognito users deleted;
    // the event is skipped (offset commits) rather than looping on completion.
    expect(cognitoDeleteUserMock).not.toHaveBeenCalled();
    expect(completeSignupUserDeletionMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it("skips a replay after completion (deletion registry entry present)", async () => {
    getSignupUserByIdMock.mockResolvedValue(undefined);
    getSignupUserDeletionMock.mockResolvedValue({
      deletedAt: new Date("2026-05-28T10:00:00.000Z"),
      signupUserId: generateId<SignupUserId>(),
    });

    await expect(
      handleSignupMessage(
        deletionEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    expect(cognitoDeleteUserMock).not.toHaveBeenCalled();
    expect(completeSignupUserDeletionMock).not.toHaveBeenCalled();
  });

  it("logs and commits (without throwing) when the user is not found and no deletion record exists, so the partition isn't blocked", async () => {
    getSignupUserByIdMock.mockResolvedValue(undefined);
    getSignupUserDeletionMock.mockResolvedValue(undefined);

    await expect(
      handleSignupMessage(
        deletionEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    // A missing row with no deletion record is a terminal anomaly (no
    // replication lag is possible), so it's logged at error and the offset
    // commits rather than redelivering forever and stalling the partition.
    expect(cognitoDeleteUserMock).not.toHaveBeenCalled();
    expect(completeSignupUserDeletionMock).not.toHaveBeenCalled();
  });

  it("rethrows a Cognito user deletion error so the message is redelivered, without completing", async () => {
    const user = getMockSignupUser({
      status: SignupUserStatus.enum.DeletionPending,
    });
    getSignupUserByIdMock.mockResolvedValue(user);
    cognitoDeleteUserMock.mockRejectedValue(new Error("Cognito unavailable"));

    await expect(
      handleSignupMessage(
        deletionEvent(user.signupUserId),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).rejects.toBeDefined();

    expect(completeSignupUserDeletionMock).not.toHaveBeenCalled();
  });
});
