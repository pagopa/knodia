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

const cognitoCreateUserMock = vi.fn();
const getSignupUserByIdMock = vi.fn();

const correlationId = generateId<CorrelationId>();
const logger = { info: vi.fn() } as unknown as Logger;

function buildDeps(): SignupUpdaterDeps {
  const node = {
    cognitoClient: { createOrganizationUser: cognitoCreateUserMock },
    orgClient: {},
  };
  return {
    internalTokenProvider: {
      get: vi.fn().mockResolvedValue({ serialized: "mock-internal-token" }),
    },
    nodeClients: { Lynx: node, Orion: node },
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
    status: "ACTIVE",
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
    const orionCall = createOrganizationMock.mock.calls[0]?.[0];
    expect(orionCall?.body).toEqual({
      attributes: [{ code: "testing_organization", scheme: "knodia" }],
      name: "Rossi Org Orion",
    });
    expect(orionCall?.headers.authorization).toBe("Bearer mock-internal-token");

    expect(cognitoCreateUserMock).toHaveBeenCalledTimes(2);
    expect(cognitoCreateUserMock.mock.calls[0]?.[0]).toMatchObject({
      email: "mario.rossi@example.org",
      familyName: "Rossi",
      givenName: "Mario",
      organizationId: orionOrgId,
      roles: ["administrative", "technical"],
      username: "mario.rossi.orion",
    });
    expect(cognitoCreateUserMock.mock.calls[1]?.[0]).toMatchObject({
      organizationId: lynxOrgId,
      username: "mario.rossi.lynx",
    });
  });

  it("treats a 409 as already processed: no throw, no Cognito user for that node", async () => {
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

    expect(createOrganizationMock).toHaveBeenCalledTimes(2);
    expect(cognitoCreateUserMock).not.toHaveBeenCalled();
  });

  it("handles a mixed result: one node created, the other already exists", async () => {
    getSignupUserByIdMock.mockResolvedValue(getMockSignupUser());
    createOrganizationMock
      .mockResolvedValueOnce({ data: { id: generateId<OrganizationId>() } })
      .mockRejectedValueOnce(conflict);

    await handleSignupMessage(
      onboardingEvent(generateId<SignupUserId>()),
      buildDeps(),
      correlationId,
      logger,
    );

    expect(createOrganizationMock).toHaveBeenCalledTimes(2);
    expect(cognitoCreateUserMock).toHaveBeenCalledTimes(1);
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

  it("throws when the signup user is not found", async () => {
    getSignupUserByIdMock.mockResolvedValue(undefined);

    await expect(
      handleSignupMessage(
        onboardingEvent(generateId<SignupUserId>()),
        buildDeps(),
        correlationId,
        logger,
      ),
    ).rejects.toBeDefined();

    expect(createOrganizationMock).not.toHaveBeenCalled();
  });
});
