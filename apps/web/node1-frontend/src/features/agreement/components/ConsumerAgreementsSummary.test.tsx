import { within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ConsumerAgreementsSummary } from "./ConsumerAgreementsSummary";

function getCardByLabel(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return within(screen.getByText(label).closest("div[class*='bg-']")!);
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
