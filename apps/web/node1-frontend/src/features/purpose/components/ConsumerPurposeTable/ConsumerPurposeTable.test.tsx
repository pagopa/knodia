import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ConsumerPurposeTable } from "./ConsumerPurposeTable";

function createPurpose(
  overrides?: Partial<bffApi.ConsumerPurpose>,
): bffApi.ConsumerPurpose {
  return {
    dailyCalls: 500,
    eservice: {
      id: "eservice-1",
      name: { en: "Birth Certificate API" },
    },
    hasRecentlyBeenUpdated: false,
    id: "purpose-1",
    keychains: 2,
    name: { en: "Purpose Alpha" },
    producer: {
      id: "producer-1",
      knodeId: "Orion",
      name: "Rigel Corp",
    },
    state: "Active",
    ...overrides,
  };
}

function renderTable(
  purposes: bffApi.ConsumerPurpose[] = [],
  isLoading = false,
) {
  return renderWithProviders(
    <ConsumerPurposeTable isLoading={isLoading} purposes={purposes} />,
    { routes: [{ path: "/consumption/purposes/$id" }] },
  );
}

describe("ConsumerPurposeTable", () => {
  it("renders the loading state", () => {
    renderTable([], true);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders purposes in a table with correct columns", () => {
    renderTable([createPurpose()]);

    expect(
      screen.getByRole("grid", { name: "Consumer purposes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("E-Service")).toBeInTheDocument();
    expect(screen.getByText("Producer")).toBeInTheDocument();
    expect(screen.getByText("Keychains")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders purpose data correctly", () => {
    renderTable([createPurpose()]);

    expect(screen.getByText("Purpose Alpha")).toBeInTheDocument();
    expect(screen.getByText("Birth Certificate API")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders recently updated icon when purpose has been recently updated", () => {
    renderTable([createPurpose({ hasRecentlyBeenUpdated: true })]);

    expect(screen.getByLabelText("Recent update")).toBeInTheDocument();
  });

  it("does not render recently updated icon when purpose has not been recently updated", () => {
    renderTable([createPurpose({ hasRecentlyBeenUpdated: false })]);

    expect(screen.queryByLabelText("Recent update")).not.toBeInTheDocument();
  });

  it("renders a link to the purpose detail page", () => {
    renderTable([createPurpose({ id: "purpose-123" })]);

    const link = screen.getByRole("link", { name: "Go to purpose" });
    expect(link).toBeInTheDocument();
  });
});
