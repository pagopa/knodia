import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { LinkedPurposesTable } from "./LinkedPurposesTable";

function createPurpose(
  overrides?: Partial<bffApi.ConsumerKeychainPurpose>,
): bffApi.ConsumerKeychainPurpose {
  return {
    eservice: { id: crypto.randomUUID(), name: { en: "Test E-Service" } },
    id: crypto.randomUUID(),
    knodeId: "Orion",
    name: { en: "Test Purpose" },
    producer: { id: crypto.randomUUID(), name: "Test Producer" },
    state: "Active",
    ...overrides,
  };
}

function renderTable(props: {
  isLoading: boolean;
  purposes: bffApi.ConsumerKeychainPurpose[];
}) {
  return renderWithProviders(<LinkedPurposesTable {...props} />, {
    routes: [
      { path: "/consumption/purposes" },
      { path: "/consumption/purposes/$id" },
    ],
  });
}

describe("LinkedPurposesTable", () => {
  it("renders a loader while loading", () => {
    renderTable({ isLoading: true, purposes: [] });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the empty-state banner with a link to the Purposes list", () => {
    renderTable({ isLoading: false, purposes: [] });

    expect(
      screen.getByText("There are no Purposes linked to this Keychain yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to Purposes list" }),
    ).toBeInTheDocument();
  });

  it("renders a row per linked purpose with its state chip", () => {
    renderTable({
      isLoading: false,
      purposes: [
        createPurpose({ name: { en: "Active One" }, state: "Active" }),
        createPurpose({ name: { en: "Suspended One" }, state: "Suspended" }),
      ],
    });

    expect(screen.getByText("Active One")).toBeInTheDocument();
    expect(screen.getByText("Suspended One")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Go to purpose" })).toHaveLength(
      2,
    );
  });
});
