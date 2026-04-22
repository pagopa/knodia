import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ConsumptionAgreementTable } from "./ConsumptionAgreementTable";

function createAgreement(
  overrides?: Partial<bffApi.ProducerAgreement>,
): bffApi.ProducerAgreement {
  return {
    consumer: {
      id: "consumer-1",
      knodeId: "Orion",
      name: "Betelgeuse",
    },
    eservice: {
      id: "eservice-1",
      name: { en: "Birth Certificate API" },
    },
    hasRecentlyBeenUpdated: true,
    id: "agreement-1",
    state: "Active",
    ...overrides,
  };
}

function renderTable(agreements: bffApi.ProducerAgreement[] = []) {
  return renderWithProviders(
    <ConsumptionAgreementTable agreements={agreements} />,
    { routes: [{ path: "/production/agreements/$id" }] },
  );
}

describe("ConsumptionAgreementTable", () => {
  it("renders with correct columns (no E-Service column)", () => {
    renderTable([createAgreement()]);

    expect(
      screen.getByRole("grid", { name: "Recently updated agreements" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Knode")).toBeInTheDocument();
    expect(screen.getByText("Consumer")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.queryByText("E-Service")).not.toBeInTheDocument();
  });

  it("renders knode and consumer as separate text columns", () => {
    renderTable([createAgreement()]);

    expect(screen.getByText("Orion Knode")).toBeInTheDocument();
    expect(screen.getByText("Betelgeuse")).toBeInTheDocument();
  });

  it("renders agreement status chip", () => {
    renderTable([createAgreement({ state: "Active" })]);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("always renders the recently updated icon", () => {
    renderTable([createAgreement()]);

    expect(screen.getByLabelText("Recent update")).toBeInTheDocument();
  });

  it("renders a link to the agreement detail page", () => {
    renderTable([createAgreement({ id: "agreement-123" })]);

    const link = screen.getByRole("link", { name: "Go to agreement" });
    expect(link).toHaveAttribute(
      "href",
      "/production/agreements/agreement-123",
    );
  });

  it("renders multiple agreements", () => {
    renderTable([
      createAgreement({
        consumer: { id: "c1", knodeId: "Orion", name: "Betelgeuse" },
        id: "a1",
      }),
      createAgreement({
        consumer: {
          id: "c2",
          knodeId: "Lynx",
          name: "Dubhe",
        },
        id: "a2",
        state: "Suspended",
      }),
    ]);

    expect(screen.getByText("Orion Knode")).toBeInTheDocument();
    expect(screen.getByText("Betelgeuse")).toBeInTheDocument();
    expect(screen.getByText("Lynx Knode")).toBeInTheDocument();
    expect(screen.getByText("Dubhe")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });
});
