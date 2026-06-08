import type { bffApi } from "@knodia/bff-client";
import type { UserRole } from "@knodia/common-models/auth";

import {
  type ProducerKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { KeychainDetailPage } from "./KeychainDetailPage";

const PRODUCER_KEYCHAIN_ID = unsafeBrandId<ProducerKeychainId>(
  "00000000-0000-4000-8000-000000000001",
);

const keychain: bffApi.KeychainDetails = {
  createdAt: "2026-04-15T10:00:00Z",
  description: { en: "Test producer keychain" },
  id: PRODUCER_KEYCHAIN_ID,
  name: { en: "Test Producer Keychain" },
  updatedAt: "2026-04-15T10:00:00Z",
};

function renderDetail(roles?: readonly UserRole[]) {
  return renderWithProviders(
    <KeychainDetailPage
      activeTab="public-keys"
      keychain={keychain}
      keychainId={PRODUCER_KEYCHAIN_ID}
      offset={0}
      onOffsetChange={vi.fn()}
      onTabChange={vi.fn()}
      type="production"
    />,
    {
      roles,
      routes: [{ path: "/keychains" }, { path: "/production/e-services" }],
    },
  );
}

describe("KeychainDetailPage — action gating", () => {
  it("renders Edit and Delete actions for administrative users", () => {
    renderDetail();

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides Edit and Delete actions for technical-only users", () => {
    renderDetail(["technical"]);

    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });
});
