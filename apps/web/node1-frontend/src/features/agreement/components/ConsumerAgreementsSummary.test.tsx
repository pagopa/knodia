import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { ConsumerAgreementsSummary } from "./ConsumerAgreementsSummary";

const BASE_URL = "http://localhost:3000/bff";

function mockConsumerAgreements(counters: {
  activeAgreements: number;
  archivedAgreements: number;
  suspendedAgreements: number;
}) {
  server.use(
    http.get(`${BASE_URL}/consumer/agreements`, () =>
      HttpResponse.json({ counters }),
    ),
  );
}

describe("ConsumerAgreementsSummary", () => {
  it("renders agreement counters from the API", async () => {
    mockConsumerAgreements({
      activeAgreements: 10,
      archivedAgreements: 3,
      suspendedAgreements: 2,
    });

    renderWithProviders(<ConsumerAgreementsSummary />, {
      routes: [
        { path: "/consumption/e-services" },
        { path: "/consumption/e-services/search" },
        { path: "/consumption/agreements/archive" },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the empty state when all counters are zero", async () => {
    mockConsumerAgreements({
      activeAgreements: 0,
      archivedAgreements: 0,
      suspendedAgreements: 0,
    });

    renderWithProviders(<ConsumerAgreementsSummary />, {
      routes: [{ path: "/consumption/e-services/search" }],
    });

    await waitFor(() => {
      expect(
        screen.getByText("You don't have any Agreements yet."),
      ).toBeInTheDocument();
    });
  });
});
