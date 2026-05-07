import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ProducerArchivedPurposeTable } from "./ProducerArchivedPurposeTable";

function createPurpose(
  overrides?: Partial<bffApi.ProducerPurpose>,
): bffApi.ProducerPurpose {
  return {
    consumer: {
      id: "consumer-1",
      knodeId: "Lynx",
      name: "Comune di Roma",
    },
    dailyCalls: 100,
    description: { en: "Purpose description" },
    eservice: {
      id: "eservice-1",
      name: { en: "Birth Certificate API" },
    },
    hasRecentlyBeenUpdated: false,
    id: "purpose-1",
    name: { en: "UE freedom of movement" },
    state: "Archived",
    updatedAt: "2026-04-15T10:00:00.000Z",
    ...overrides,
  };
}

function renderTable(
  purposes: bffApi.ProducerPurpose[] = [],
  { isLoading = false }: { isLoading?: boolean } = {},
) {
  return renderWithProviders(
    <ProducerArchivedPurposeTable isLoading={isLoading} purposes={purposes} />,
  );
}

describe("ProducerArchivedPurposeTable", () => {
  it("renders the loading state", () => {
    renderTable([], { isLoading: true });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the empty state when there are no purposes", () => {
    renderTable();

    expect(
      screen.getByText("You don't have any archived Purposes yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Purposes archived by your Consumers will be displayed here.",
      ),
    ).toBeInTheDocument();
  });

  it("renders archived purposes with all column headers", () => {
    renderTable([createPurpose()]);

    expect(
      screen.getByRole("grid", { name: "Archived producer purposes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Archiving date")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("E-Service")).toBeInTheDocument();
    expect(screen.getByText("Consumer")).toBeInTheDocument();
  });

  it("renders purpose data in cells with consumer avatar initials", () => {
    renderTable([createPurpose()]);

    expect(screen.getByText("UE freedom of movement")).toBeInTheDocument();
    expect(screen.getByText("Birth Certificate API")).toBeInTheDocument();
    expect(screen.getByText("LK")).toBeInTheDocument(); // KnodeAvatar fallback initials (Lynx Knode)
    expect(screen.getByText("Comune di Roma")).toBeInTheDocument();
  });

  it("does not render any link or detail arrow on rows", () => {
    renderTable([createPurpose()]);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders multiple purposes", () => {
    renderTable([
      createPurpose({
        id: "p1",
        name: { en: "UE freedom of movement" },
      }),
      createPurpose({
        consumer: { id: "c2", knodeId: "Orion", name: "Comune di Milano" },
        id: "p2",
        name: { en: "Cross-border social security coordination" },
      }),
    ]);

    expect(screen.getByText("UE freedom of movement")).toBeInTheDocument();
    expect(
      screen.getByText("Cross-border social security coordination"),
    ).toBeInTheDocument();
    expect(screen.getByText("Comune di Roma")).toBeInTheDocument();
    expect(screen.getByText("Comune di Milano")).toBeInTheDocument();
  });
});
