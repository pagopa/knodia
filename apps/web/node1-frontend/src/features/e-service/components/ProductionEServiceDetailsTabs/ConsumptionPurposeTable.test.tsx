import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ConsumptionPurposeTable } from "./ConsumptionPurposeTable";

function createPurpose(
  overrides?: Partial<bffApi.ProducerPurpose>,
): bffApi.ProducerPurpose {
  return {
    consumer: {
      id: "consumer-1",
      knodeId: "Orion",
      name: "Betelgeuse",
    },
    dailyCalls: 100,
    description: { en: "Purpose description" },
    eservice: {
      id: "eservice-1",
      name: { en: "Birth Certificate API" },
    },
    hasRecentlyBeenUpdated: true,
    id: "purpose-1",
    name: { en: "Health coverage in another EU country" },
    state: "Active",
    ...overrides,
  };
}

function renderTable(purposes: bffApi.ProducerPurpose[] = []) {
  return renderWithProviders(<ConsumptionPurposeTable purposes={purposes} />, {
    routes: [{ path: "/production/purposes/$id" }],
  });
}

describe("ConsumptionPurposeTable", () => {
  it("renders with correct columns (no E-Service column)", () => {
    renderTable([createPurpose()]);

    expect(
      screen.getByRole("grid", { name: "Recently updated purposes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Consumer")).toBeInTheDocument();
    expect(screen.getByText("Calls/Day")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.queryByText("E-Service")).not.toBeInTheDocument();
  });

  it("renders purpose data correctly", () => {
    renderTable([createPurpose()]);

    expect(
      screen.getByText("Health coverage in another EU country"),
    ).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument(); // KnodeAvatar initials (Orion Knode)
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("always renders the recently updated icon", () => {
    renderTable([createPurpose()]);

    expect(screen.getByLabelText("Recent update")).toBeInTheDocument();
  });

  it("renders a link to the purpose detail page", () => {
    renderTable([createPurpose({ id: "purpose-123" })]);

    const link = screen.getByRole("link", { name: "Go to purpose" });
    expect(link).toHaveAttribute("href", "/production/purposes/purpose-123");
  });

  it("renders multiple purposes", () => {
    renderTable([
      createPurpose({
        id: "p1",
        name: { en: "Purpose One" },
      }),
      createPurpose({
        consumer: {
          id: "c2",
          knodeId: "Lynx",
          name: "Dubhe",
        },
        dailyCalls: 1000,
        id: "p2",
        name: { en: "Purpose Two" },
        state: "Suspended",
      }),
    ]);

    expect(screen.getByText("Purpose One")).toBeInTheDocument();
    expect(screen.getByText("Purpose Two")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });
});
