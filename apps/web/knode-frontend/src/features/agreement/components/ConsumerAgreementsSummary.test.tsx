import { within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ConsumerAgreementsSummary } from "./ConsumerAgreementsSummary";

const emptyCounters = {
  activeAgreements: 0,
  archivedAgreements: 0,
  suspendedAgreements: 0,
} as const;

function getCardByLabel(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return within(screen.getAllByText(label)[0]!.closest("div[class*='bg-']")!);
}

describe("ConsumerAgreementsSummary", () => {
  it("renders the correct counter for each agreement state", () => {
    renderWithProviders(
      <ConsumerAgreementsSummary
        counters={{
          activeAgreements: 10,
          archivedAgreements: 3,
          suspendedAgreements: 2,
        }}
      />,
      {
        routes: [
          { path: "/consumption/e-services" },
          { path: "/consumption/e-services/search" },
          { path: "/consumption/agreements/archive" },
        ],
      },
    );

    expect(getCardByLabel("Active").getByText("10")).toBeInTheDocument();
    expect(getCardByLabel("Suspended").getByText("2")).toBeInTheDocument();
    expect(getCardByLabel("Archived").getByText("3")).toBeInTheDocument();
  });

  it("renders the empty state when all counters are zero", () => {
    renderWithProviders(
      <ConsumerAgreementsSummary counters={emptyCounters} />,
      {
        routes: [{ path: "/consumption/e-services/search" }],
      },
    );

    expect(
      screen.getByText("You don't have any Agreements yet."),
    ).toBeInTheDocument();
  });

  it("shows search button and description in empty state for administrative users", () => {
    renderWithProviders(
      <ConsumerAgreementsSummary counters={emptyCounters} />,
      {
        roles: ["administrative"],
        routes: [{ path: "/consumption/e-services/search" }],
      },
    );

    expect(
      screen.getByRole("button", { name: "Search new E-Services" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Search for an E-Service to request an Agreement."),
    ).toBeInTheDocument();
  });

  it("hides search button and description in empty state for technical-only users", () => {
    renderWithProviders(
      <ConsumerAgreementsSummary counters={emptyCounters} />,
      {
        roles: ["technical"],
        routes: [{ path: "/consumption/e-services/search" }],
      },
    );

    expect(
      screen.queryByRole("button", { name: "Search new E-Services" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Search for an E-Service to request an Agreement."),
    ).not.toBeInTheDocument();
  });
});
