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
  type EmailChangeRequest,
  type EmailChangeRequestedV1,
  OnboardingCompletedV1,
  SignupUser,
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

import type { SignupUpdaterDeps } from "../src/utils/utils.ts";

import { handleSignupMessage } from "../src/services/consumerService.ts";
import { externalOrganizationId } from "../src/utils/externalOrganizationId.ts";

const cognitoCreateUserMock = vi.fn();
const cognitoUpdateUserEmailMock = vi.fn();
const deleteEmailChangeRequestMock = vi.fn();
const getEmailChangeRequestByIdMock = vi.fn();
const getSignupUserByIdMock = vi.fn();
const updateSignupUserEmailMock = vi.fn();

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
      deleteEmailChangeRequest: deleteEmailChangeRequestMock,
      getEmailChangeRequestById: getEmailChangeRequestByIdMock,
      getSignupUserById: getSignupUserByIdMock,
      updateSignupUserEmail: updateSignupUserEmailMock,
    },
  } as unknown as SignupUpdaterDeps;
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
  return {
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
}

function onboardingEvent(signupUserId: SignupUserId): OnboardingCompletedV1 {
  const event = zocker(OnboardingCompletedV1).setSeed(0).generate();
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

const conflict = { isAxiosError: true, response: { status: 409 } };

describe("handleSignupMessage — OnboardingCompletedV1", () => {
  beforeEach(() => {
    createOrganizationMock.mockReset();
    cognitoCreateUserMock.mockReset();
    cognitoUpdateUserEmailMock.mockReset();
    deleteEmailChangeRequestMock.mockReset();
    getEmailChangeRequestByIdMock.mockReset();
    getSignupUserByIdMock.mockReset();
    updateSignupUserEmailMock.mockReset();
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
      attributes: [{ code: "testing_organization", scheme: "knodia" }],
      externalOrganizationId: externalOrganizationId(
        user.signupUserId,
        "Orion",
      ),
      name: "Rossi Org Orion",
    });
    expect(orionCall?.headers.authorization).toBe("Bearer mock-internal-token");

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

  it("skips (without throwing) when the signup user is not found, provisioning nothing", async () => {
    getSignupUserByIdMock.mockResolvedValue(undefined);

    await expect(
      handleSignupMessage(
        onboardingEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).resolves.toBeUndefined();

    // A missing user is obsolete and unrecoverable, so the event is skipped
    // (the offset commits) with a warning rather than blocking the partition.
    expect(createOrganizationMock).not.toHaveBeenCalled();
    expect(cognitoCreateUserMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});

describe("handleSignupMessage — EmailChangeRequestedV1", () => {
  beforeEach(() => {
    createOrganizationMock.mockReset();
    cognitoCreateUserMock.mockReset();
    cognitoUpdateUserEmailMock.mockReset();
    deleteEmailChangeRequestMock.mockReset();
    getEmailChangeRequestByIdMock.mockReset();
    getSignupUserByIdMock.mockReset();
    updateSignupUserEmailMock.mockReset();
    vi.mocked(logger.error).mockReset();
    vi.mocked(logger.info).mockReset();
    vi.mocked(logger.warn).mockReset();
  });

  it("updates the signup user email, updates Cognito on both nodes, and deletes the request", async () => {
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
    expect(cognitoUpdateUserEmailMock).toHaveBeenCalledTimes(1);
    expect(deleteEmailChangeRequestMock).not.toHaveBeenCalled();
  });
});
