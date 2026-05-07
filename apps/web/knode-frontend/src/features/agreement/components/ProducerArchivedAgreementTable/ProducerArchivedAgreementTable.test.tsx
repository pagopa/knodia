import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ProducerArchivedAgreementTable } from "./ProducerArchivedAgreementTable";

function createAgreement(
  overrides?: Partial<bffApi.ProducerAgreement>,
): bffApi.ProducerAgreement {
  return {
    consumer: {
      id: "consumer-1",
      knodeId: "Lynx",
      name: "Comune di Roma",
    },
    eservice: {
      id: "eservice-1",
      name: { en: "Birth Certificate API" },
    },
    hasRecentlyBeenUpdated: false,
    id: "agreement-1",
    state: "Archived",
    updatedAt: "2026-04-15T10:00:00.000Z",
    ...overrides,
  };
}

function renderTable(
  agreements: bffApi.ProducerAgreement[] = [],
  { isLoading = false }: { isLoading?: boolean } = {},
) {
  return renderWithProviders(
    <ProducerArchivedAgreementTable
      agreements={agreements}
      isLoading={isLoading}
    />,
  );
}

describe("ProducerArchivedAgreementTable", () => {
  it("renders the loading state", () => {
    renderTable([], { isLoading: true });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the empty state when there are no agreements", () => {
    renderTable();

    expect(
      screen.getByText("You don't have any archived Agreements yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Agreements archived by your Consumers will be displayed here.",
      ),
    ).toBeInTheDocument();
  });

  it("renders archived agreements with all column headers", () => {
    renderTable([createAgreement()]);

    expect(
      screen.getByRole("grid", { name: "Archived producer agreements" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Archiving date")).toBeInTheDocument();
    expect(screen.getByText("E-Service")).toBeInTheDocument();
    expect(screen.getByText("Consumer Knode")).toBeInTheDocument();
    expect(screen.getByText("Consumer")).toBeInTheDocument();
  });

  it("renders agreement data in cells", () => {
    renderTable([createAgreement()]);

    expect(screen.getByText("Birth Certificate API")).toBeInTheDocument();
    expect(screen.getByText("Lynx Knode")).toBeInTheDocument();
    expect(screen.getByText("Comune di Roma")).toBeInTheDocument();
  });

  it("does not render any link or detail arrow on rows", () => {
    renderTable([createAgreement()]);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders multiple agreements", () => {
    renderTable([
      createAgreement({
        consumer: { id: "c1", knodeId: "Orion", name: "Comune di Milano" },
        eservice: { id: "e1", name: { en: "API Registry" } },
        id: "a1",
      }),
      createAgreement({
        consumer: { id: "c2", knodeId: "Lynx", name: "Comune di Roma" },
        eservice: { id: "e2", name: { en: "Tax Service" } },
        id: "a2",
      }),
    ]);

    expect(screen.getByText("API Registry")).toBeInTheDocument();
    expect(screen.getByText("Tax Service")).toBeInTheDocument();
    expect(screen.getByText("Orion Knode")).toBeInTheDocument();
    expect(screen.getByText("Lynx Knode")).toBeInTheDocument();
    expect(screen.getByText("Comune di Milano")).toBeInTheDocument();
    expect(screen.getByText("Comune di Roma")).toBeInTheDocument();
  });
});
