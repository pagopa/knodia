import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ProducerAgreementTable } from "./ProducerAgreementTable";

function createAgreement(
  overrides?: Partial<bffApi.ProducerAgreement>,
): bffApi.ProducerAgreement {
  return {
    consumer: {
      id: "consumer-1",
      knodeId: "Lynx",
      name: "Ursa Major",
    },
    eservice: {
      id: "eservice-1",
      name: { en: "Birth Certificate API" },
    },
    hasRecentlyBeenUpdated: false,
    id: "agreement-1",
    state: "Active",
    ...overrides,
  };
}

function renderTable(
  agreements: bffApi.ProducerAgreement[] = [],
  isLoading = false,
) {
  return renderWithProviders(
    <ProducerAgreementTable agreements={agreements} isLoading={isLoading} />,
    { routes: [{ path: "/production/agreements/$id" }] },
  );
}

describe("ProducerAgreementTable", () => {
  it("renders the loading state", () => {
    renderTable([], true);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(
      screen.queryByText("There are no Agreements for your E-Services."),
    ).not.toBeInTheDocument();
  });

  it("renders the empty state when there are no agreements", () => {
    renderTable([]);

    expect(
      screen.getByText("There are no Agreements for your E-Services."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Agreements requested for your E-Services by Consumer Organizations will appear here.",
      ),
    ).toBeInTheDocument();
  });

  it("renders agreements in a table with correct columns", () => {
    renderTable([createAgreement()]);

    expect(
      screen.getByRole("grid", { name: "Producer agreements" }),
    ).toBeInTheDocument();
    expect(screen.getByText("E-Service")).toBeInTheDocument();
    expect(screen.getByText("Consumer")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders agreement data correctly", () => {
    renderTable([
      createAgreement({
        consumer: { id: "c1", knodeId: "Lynx", name: "Ursa Major" },
        eservice: {
          id: "e1",
          name: { en: "Birth Certificate API" },
        },
        id: "a1",
        state: "Active",
      }),
    ]);

    expect(screen.getByText("Birth Certificate API")).toBeInTheDocument();
    expect(screen.getByText("LK")).toBeInTheDocument(); // KnodeAvatar initials (Lynx Knode)
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders Active chip with success style", () => {
    renderTable([createAgreement({ state: "Active" })]);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders Suspended chip with error style", () => {
    renderTable([createAgreement({ state: "Suspended" })]);

    expect(screen.getByText("Suspended")).toBeInTheDocument();
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
        state: "Suspended",
      }),
    ]);

    expect(screen.getByText("API Registry")).toBeInTheDocument();
    expect(screen.getByText("Tax Service")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("renders recently updated icon when agreement has been recently updated", () => {
    renderTable([createAgreement({ hasRecentlyBeenUpdated: true })]);

    expect(screen.getByLabelText("Recently updated")).toBeInTheDocument();
  });

  it("does not render recently updated icon when agreement has not been recently updated", () => {
    renderTable([createAgreement({ hasRecentlyBeenUpdated: false })]);

    expect(screen.queryByLabelText("Recently updated")).not.toBeInTheDocument();
  });

  it("renders a link to the agreement detail page", () => {
    renderTable([createAgreement({ id: "agreement-123" })]);

    const link = screen.getByRole("link", { name: "Go to agreement" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "/production/agreements/agreement-123",
    );
  });
});
