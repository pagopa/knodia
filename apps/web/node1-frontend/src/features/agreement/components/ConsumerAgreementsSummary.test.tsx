import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ConsumerAgreementsSummary } from "./ConsumerAgreementsSummary";

describe("ConsumerAgreementsSummary", () => {
  it("renders agreement counters", () => {
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

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the empty state when all counters are zero", () => {
    renderWithProviders(
      <ConsumerAgreementsSummary
        counters={{
          activeAgreements: 0,
          archivedAgreements: 0,
          suspendedAgreements: 0,
        }}
      />,
      {
        routes: [{ path: "/consumption/e-services/search" }],
      },
    );

    expect(
      screen.getByText("You don't have any Agreements yet."),
    ).toBeInTheDocument();
  });
});
