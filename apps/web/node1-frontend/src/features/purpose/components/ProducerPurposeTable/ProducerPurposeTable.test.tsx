import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ProducerPurposeTable } from "./ProducerPurposeTable";

function createPurpose(
  overrides?: Partial<bffApi.ProducerPurpose>,
): bffApi.ProducerPurpose {
  return {
    consumer: {
      id: "consumer-1",
      knodeId: "Lynx",
      name: "Ursa Major",
    },
    dailyCalls: 1000,
    description: { en: "Purpose description" },
    eservice: {
      id: "eservice-1",
      name: { en: "Birth Certificate API" },
    },
    hasRecentlyBeenUpdated: false,
    id: "purpose-1",
    name: { en: "Purpose Alpha" },
    state: "Active",
    ...overrides,
  };
}

function renderTable(
  purposes: bffApi.ProducerPurpose[] = [],
  isLoading = false,
) {
  return renderWithProviders(
    <ProducerPurposeTable isLoading={isLoading} purposes={purposes} />,
    { routes: [{ path: "/production/purposes/$id" }] },
  );
}

describe("ProducerPurposeTable", () => {
  it("renders the loading state", () => {
    renderTable([], true);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(
      screen.queryByText("There are no Purposes for your E-Services yet."),
    ).not.toBeInTheDocument();
  });

  it("renders the empty state when there are no purposes", () => {
    renderTable([]);

    expect(
      screen.getByText("There are no Purposes for your E-Services yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Purposes created for your E-Services by Consumer Organizations will appear here.",
      ),
    ).toBeInTheDocument();
  });

  it("renders purposes in a table with correct columns", () => {
    renderTable([createPurpose()]);

    expect(
      screen.getByRole("grid", { name: "Producer purposes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("E-Service")).toBeInTheDocument();
    expect(screen.getByText("Consumer")).toBeInTheDocument();
    expect(screen.getByText("Calls/Day")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders purpose data correctly", () => {
    renderTable([createPurpose()]);

    expect(screen.getByText("Purpose Alpha")).toBeInTheDocument();
    expect(screen.getByText("Birth Certificate API")).toBeInTheDocument();
    expect(screen.getByText("LK")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders recently updated icon when purpose has been recently updated", () => {
    renderTable([createPurpose({ hasRecentlyBeenUpdated: true })]);

    expect(screen.getByLabelText("Recent update")).toBeInTheDocument();
  });

  it("does not render recently updated icon when purpose has not been recently updated", () => {
    renderTable([createPurpose({ hasRecentlyBeenUpdated: false })]);

    expect(screen.queryByLabelText("Recent update")).not.toBeInTheDocument();
  });

  it("renders a link to the purpose detail page", () => {
    renderTable([createPurpose({ id: "purpose-123" })]);

    const link = screen.getByRole("link", { name: "Go to purpose" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/production/purposes/purpose-123");
  });

  it("renders multiple purposes", () => {
    renderTable([
      createPurpose({
        eservice: { id: "e1", name: { en: "API Registry" } },
        id: "p1",
        name: { en: "Purpose One" },
      }),
      createPurpose({
        eservice: { id: "e2", name: { en: "Tax Service" } },
        id: "p2",
        name: { en: "Purpose Two" },
        state: "Suspended",
      }),
    ]);

    expect(screen.getByText("Purpose One")).toBeInTheDocument();
    expect(screen.getByText("Purpose Two")).toBeInTheDocument();
    expect(screen.getByText("API Registry")).toBeInTheDocument();
    expect(screen.getByText("Tax Service")).toBeInTheDocument();
  });
});
