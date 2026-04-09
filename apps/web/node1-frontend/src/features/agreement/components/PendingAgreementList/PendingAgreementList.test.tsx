import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { PendingAgreementList } from "./PendingAgreementList";

const mockAgreement: bffApi.PendingConsumerAgreement = {
  eservice: {
    categories: [{ code: "main-address", scheme: "it-national-data" }],
    id: crypto.randomUUID(),
    mode: "ProvideData",
    name: { en: "Vehicle registration details" },
    state: "Active",
  },
  id: crypto.randomUUID(),
  producer: { id: crypto.randomUUID(), knodeId: "Orion", name: "Producer Org" },
};

describe("PendingAgreementList", () => {
  it("shows empty state when there are no pending agreements", () => {
    renderWithProviders(<PendingAgreementList agreements={[]} />, {
      routes: [{ path: "/consumption/e-services/$id" }],
    });

    expect(screen.getByText("No actions are needed.")).toBeInTheDocument();
  });

  it("renders agreement cards with e-service name and producer", () => {
    renderWithProviders(<PendingAgreementList agreements={[mockAgreement]} />, {
      routes: [{ path: "/consumption/e-services/$id" }],
    });

    expect(
      screen.getByText("Vehicle registration details"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Producer Org").length).toBeGreaterThan(0);
  });
});
