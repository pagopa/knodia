import type { bffApi } from "@knodia/bff-client";

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ProductionEserviceDetailsProvider } from "@/features/e-service/contexts/ProductionEserviceDetailsProvider";
import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { ProductionEServiceConsumptionTab } from "./ProductionEServiceConsumptionTab";

const BASE_URL = "http://localhost:3000/bff";

function createEserviceDetails(
  overrides?: Partial<bffApi.ProducerEserviceDetails>,
): bffApi.ProducerEserviceDetails {
  return {
    agreements: { active: 0, suspended: 0 },
    categories: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    description: { en: "desc" },
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    isConsumerOperatorIdentificationRequired: false,
    isSignalHubEnabled: false,
    mode: "ProvideData",
    name: { en: "Test E-Service" },
    producerId: "00000000-0000-0000-0000-000000000001",
    purposes: { active: 0, suspended: 0, totalApiCallsPerDay: 0 },
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: {
      accessTokenAudience: ["aud"],
      accessTokenDuration: 60,
      accessTokenType: "Bearer",
      createdAt: "2026-01-01T00:00:00.000Z",
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      interfaceDocument: { checksum: "abc", prettyName: { en: "Spec" } },
      maxDailyCallsPerConsumer: 100,
      maxDailyCallsPerKnode: 1000,
      requiredAttributes: [],
      state: "Active",
      updatedAt: "2026-01-01T00:00:00.000Z",
      versionNumber: 1,
    },
    ...overrides,
  };
}

function renderTab(eservice: bffApi.ProducerEserviceDetails) {
  return renderWithProviders(
    <ProductionEserviceDetailsProvider eservice={eservice}>
      <ProductionEServiceConsumptionTab />
    </ProductionEserviceDetailsProvider>,
  );
}

describe("ProductionEServiceConsumptionTab — Agreements section", () => {
  it("shows the empty-state banner when there are no Active or Suspended agreements", () => {
    renderTab(createEserviceDetails());

    expect(
      screen.getByText("There are no Agreements for this E-Service yet."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    expect(screen.queryByText("Suspended")).not.toBeInTheDocument();
  });

  it("renders Active and Suspended counters when there are agreements", async () => {
    server.use(
      http.get(`${BASE_URL}/producer/agreements`, () =>
        HttpResponse.json({
          pagination: { limit: 10, offset: 0, total: 0 },
          results: [],
        }),
      ),
    );

    renderTab(
      createEserviceDetails({
        agreements: { active: 3, suspended: 1 },
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders Active before Suspended in DOM order", async () => {
    server.use(
      http.get(`${BASE_URL}/producer/agreements`, () =>
        HttpResponse.json({
          pagination: { limit: 10, offset: 0, total: 0 },
          results: [],
        }),
      ),
    );

    renderTab(
      createEserviceDetails({
        agreements: { active: 7, suspended: 2 },
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    const labels = screen.getAllByText(/^(Active|Suspended)$/);
    expect(labels.map((el) => el.textContent)).toEqual(["Active", "Suspended"]);
  });
});

describe("ProductionEServiceConsumptionTab — Purposes section", () => {
  it("shows the empty-state banner when there are no Active or Suspended Purposes", () => {
    renderTab(createEserviceDetails());

    expect(
      screen.getByText("There are no Purposes for this E-Service yet."),
    ).toBeInTheDocument();
  });

  it("renders Active and Suspended counters when there are Purposes", () => {
    renderTab(
      createEserviceDetails({
        purposes: { active: 3, suspended: 1, totalApiCallsPerDay: 0 },
      }),
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
