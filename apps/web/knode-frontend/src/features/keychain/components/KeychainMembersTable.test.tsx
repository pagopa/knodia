import type { bffApi } from "@knodia/bff-client";

import { generateId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import type { SupportedKeychain } from "../models/commons";

import { KeychainMembersTable } from "./KeychainMembersTable";

const keychain: SupportedKeychain = {
  keychainId: generateId(),
  type: "consumption",
};

const activeMember: bffApi.User = {
  email: "mario.rossi@example.com",
  id: generateId(),
  username: "Mario Rossi",
};

describe("KeychainMembersTable", () => {
  it("renders active members with their username and email", () => {
    renderWithProviders(
      <KeychainMembersTable
        isLoading={false}
        keychain={keychain}
        members={[activeMember]}
      />,
    );

    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.getByText("mario.rossi@example.com")).toBeInTheDocument();
  });
});
