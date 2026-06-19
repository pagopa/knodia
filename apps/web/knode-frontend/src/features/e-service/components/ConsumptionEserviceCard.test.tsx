import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ConsumptionEserviceCard } from "./ConsumptionEserviceCard";

function createEservice(
  overrides?: Partial<bffApi.ConsumerEservice>,
): bffApi.ConsumerEservice {
  return {
    activePurposes: 1,
    agreement: {
      id: crypto.randomUUID(),
      state: "Active",
    },
    categories: [{ code: "birth-place", scheme: "eu-categories" }],
    consumerKeychains: 0,
    hasRecentlyBeenUpdated: false,
    id: crypto.randomUUID(),
    knodeId: "Lynx",
    mode: "ProvideData",
    name: { en: "Test E-Service" },
    producer: {
      id: crypto.randomUUID(),
      name: "Ursa Major",
    },
    requiredAttributes: [],
    state: "Active",
    ...overrides,
  };
}

function renderCard(eservice: bffApi.ConsumerEservice) {
  return renderWithProviders(<ConsumptionEserviceCard eservice={eservice} />, {
    routes: [{ path: "/consumption/e-services/$id" }],
  });
}

describe("ConsumptionEserviceCard", () => {
  it("renders the eservice name", () => {
    renderCard(createEservice());

    expect(screen.getByText("Test E-Service")).toBeInTheDocument();
  });

  it("renders recently updated chip when eservice has been recently updated", () => {
    renderCard(createEservice({ hasRecentlyBeenUpdated: true }));

    expect(screen.getByText("Recent update")).toBeInTheDocument();
  });

  it("does not render recently updated chip when eservice has not been recently updated", () => {
    renderCard(createEservice({ hasRecentlyBeenUpdated: false }));

    expect(screen.queryByText("Recent update")).not.toBeInTheDocument();
  });
});
