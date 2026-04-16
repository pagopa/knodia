import type { bffApi } from "@knodia/bff-client";
import type { EserviceId } from "@knodia/common-models/ids";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ProducerPurposeSection } from "./ProducerPurposeSection";

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

const noop = vi.fn();

function renderSection({
  eserviceId,
  isLoading = false,
  purposes = [],
}: {
  eserviceId?: EserviceId;
  isLoading?: boolean;
  purposes?: bffApi.ProducerPurpose[];
} = {}) {
  return renderWithProviders(
    <ProducerPurposeSection
      eserviceId={eserviceId}
      isLoading={isLoading}
      onEserviceIdChange={noop}
      purposes={purposes}
    />,
    { routes: [{ path: "/production/purposes/$id" }] },
  );
}

describe("ProducerPurposeSection", () => {
  it("renders the empty state when there are no purposes and no filters", () => {
    renderSection();

    expect(
      screen.getByText("There are no Purposes for your E-Services yet."),
    ).toBeInTheDocument();
  });

  it("renders the loading state with filter visible", () => {
    renderSection({ isLoading: true });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByText("E-Service")).toBeInTheDocument();
  });

  it("renders no-match empty state when filter is active but no results", () => {
    renderSection({
      eserviceId: unsafeBrandId<EserviceId>(
        "00000000-0000-0000-0000-000000000001",
      ),
    });

    expect(
      screen.getByText("No Purposes match the selected filter."),
    ).toBeInTheDocument();
    expect(screen.getByText("E-Service")).toBeInTheDocument();
  });

  it("renders purposes table when data is available", () => {
    renderSection({ purposes: [createPurpose()] });

    expect(
      screen.getByRole("grid", { name: "Producer purposes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Purpose Alpha")).toBeInTheDocument();
  });
});
