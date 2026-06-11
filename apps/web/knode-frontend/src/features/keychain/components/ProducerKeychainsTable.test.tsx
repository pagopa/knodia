import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ProducerKeychainsTable } from "./ProducerKeychainsTable";

function createKeychain(overrides?: Partial<bffApi.Keychain>): bffApi.Keychain {
  return {
    id: crypto.randomUUID(),
    keysCount: 3,
    membersCount: 1,
    name: { en: "Test Keychain" },
    ...overrides,
  };
}

function renderTable(props: {
  isLoading: boolean;
  keychains: bffApi.Keychain[];
  rowActions?: (keychain: bffApi.Keychain) => React.ReactNode;
}) {
  return renderWithProviders(
    <ProducerKeychainsTable
      emptyState={<span>No keychains connected</span>}
      {...props}
    />,
    { routes: [{ path: "/keychains/production/$id" }] },
  );
}

describe("ProducerKeychainsTable", () => {
  it("renders a loader while loading", () => {
    renderTable({ isLoading: true, keychains: [] });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the provided empty-state node when there are no keychains", () => {
    renderTable({ isLoading: false, keychains: [] });

    expect(screen.getByText("No keychains connected")).toBeInTheDocument();
  });

  it("renders a row per keychain with name, type and keys count", () => {
    renderTable({
      isLoading: false,
      keychains: [
        createKeychain({ keysCount: 12, name: { en: "Health coverage" } }),
        createKeychain({ keysCount: 3, name: { en: "Maintenance" } }),
      ],
    });

    expect(screen.getByText("Health coverage")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("Production")).toHaveLength(2);
  });

  it("renders row actions when provided", () => {
    renderTable({
      isLoading: false,
      keychains: [createKeychain({ name: { en: "Health coverage" } })],
      rowActions: (keychain) => <span>unlink-{keychain.name.en}</span>,
    });

    expect(screen.getByText("unlink-Health coverage")).toBeInTheDocument();
  });
});
