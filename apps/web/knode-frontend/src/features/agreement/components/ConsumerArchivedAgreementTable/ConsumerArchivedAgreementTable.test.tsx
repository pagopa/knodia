import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ConsumerArchivedAgreementTable } from "./ConsumerArchivedAgreementTable";

function createAgreement(
  overrides?: Partial<bffApi.ConsumerAgreement>,
): bffApi.ConsumerAgreement {
  return {
    eservice: {
      id: "eservice-1",
      name: { en: "Birth Certificate API" },
    },
    id: "agreement-1",
    producer: {
      id: "producer-1",
      knodeId: "Lynx",
      name: "City Hall",
    },
    state: "Archived",
    updatedAt: "2026-04-15T10:00:00.000Z",
    ...overrides,
  };
}

function renderTable(
  agreements: bffApi.ConsumerAgreement[] = [],
  { isLoading = false }: { isLoading?: boolean } = {},
) {
  return renderWithProviders(
    <ConsumerArchivedAgreementTable
      agreements={agreements}
      isLoading={isLoading}
    />,
    { routes: [{ path: "/consumption/e-services/$id" }] },
  );
}

describe("ConsumerArchivedAgreementTable", () => {
  it("renders the loading state", () => {
    renderTable([], { isLoading: true });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the empty state when there are no agreements", () => {
    renderTable();

    expect(
      screen.getByText("You haven't archived any Agreement yet."),
    ).toBeInTheDocument();
  });

  it("renders archived agreements with all column headers", () => {
    renderTable([createAgreement()]);

    expect(
      screen.getByRole("grid", { name: "Archived agreements" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Archiving date")).toBeInTheDocument();
    expect(screen.getByText("E-Service")).toBeInTheDocument();
    expect(screen.getByText("Producer Knode")).toBeInTheDocument();
    expect(screen.getByText("Producer")).toBeInTheDocument();
  });

  it("renders agreement data in cells", () => {
    renderTable([createAgreement()]);

    expect(screen.getByText("Birth Certificate API")).toBeInTheDocument();
    expect(screen.getByText("Lynx Knode")).toBeInTheDocument();
    expect(screen.getByText("City Hall")).toBeInTheDocument();
  });

  it("renders the e-service name as a link to the consumer detail page", () => {
    renderTable([
      createAgreement({
        eservice: { id: "eservice-42", name: { en: "Tax Service" } },
      }),
    ]);

    const link = screen.getByRole("link", { name: "Tax Service" });
    expect(link).toHaveAttribute(
      "href",
      "/consumption/e-services/eservice-42?knodeId=Lynx",
    );
  });

  it("renders multiple agreements", () => {
    renderTable([
      createAgreement({
        eservice: { id: "e1", name: { en: "API Registry" } },
        id: "a1",
      }),
      createAgreement({
        eservice: { id: "e2", name: { en: "Tax Service" } },
        id: "a2",
      }),
    ]);

    expect(screen.getByText("API Registry")).toBeInTheDocument();
    expect(screen.getByText("Tax Service")).toBeInTheDocument();
  });
});
