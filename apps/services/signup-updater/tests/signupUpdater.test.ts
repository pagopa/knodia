import type { SignupEventV1, SignupUser } from "@knodia/signup-models";
import type { Logger } from "pino";

import {
  type CorrelationId,
  generateId,
  type OrganizationId,
  type SignupUserId,
} from "@knodia/common-models/ids";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
const getSignupUserByIdMock = vi.fn();

const correlationId = generateId<CorrelationId>();
const logger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
} as unknown as Logger;

function buildDeps(): SignupUpdaterDeps {
  const node = {
    cognitoClient: { createOrganizationUser: cognitoCreateUserMock },
    internalTokenProvider: {
      get: vi.fn().mockResolvedValue({ serialized: "mock-internal-token" }),
    },
    orgClient: {},
  };
  return {
    knodeClients: { Lynx: node, Orion: node },
    signupDbService: { getSignupUserById: getSignupUserByIdMock },
  } as unknown as SignupUpdaterDeps;
}

function getMockSignupUser(overrides: Partial<SignupUser> = {}): SignupUser {
  return {
    createdAt: new Date("2026-05-28T10:00:00Z"),
    dateOfBirth: "1990-01-01",
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
    spidCode: "SPID-123",
    status: "Active",
    updatedAt: new Date("2026-05-28T10:00:00Z"),
    ...overrides,
  };
}

function onboardingEvent(signupUserId: SignupUserId): SignupEventV1 {
  return { data: { signupUserId }, type: "OnboardingCompletedV1" };
}

const conflict = { isAxiosError: true, response: { status: 409 } };

describe("handleSignupMessage — OnboardingCompletedV1", () => {
  beforeEach(() => {
    createOrganizationMock.mockReset();
    cognitoCreateUserMock.mockReset();
    getSignupUserByIdMock.mockReset();
    vi.mocked(logger.error).mockReset();
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
