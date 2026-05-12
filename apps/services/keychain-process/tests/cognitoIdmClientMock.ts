import { vi } from "vitest";

export const cognitoIdmClientMock = {
  checkUserBelongsToOrganization: vi.fn(),
  getOrganizationUsers: vi.fn(),
  getUserById: vi.fn(),
};

export const cognitoIdmClientModuleMock = {
  buildCognitoIdmClient: () => cognitoIdmClientMock,
};
