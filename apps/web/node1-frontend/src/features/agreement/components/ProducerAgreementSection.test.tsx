import type { bffApi } from "@knodia/bff-client";

import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ProducerAgreementSection } from "./ProducerAgreementSection";

function createAgreement(
  overrides?: Partial<bffApi.ProducerAgreement>,
): bffApi.ProducerAgreement {
  return {
    consumer: {
      id: "consumer-1",
      knodeId: "Lynx",
      name: "Ursa Major",
    },
    eservice: {
      id: "eservice-1",
      name: { en: "Birth Certificate API" },
    },
    hasRecentlyBeenUpdated: false,
    id: "agreement-1",
    state: "Active",
    ...overrides,
  };
}

const noop = vi.fn();

function renderSection({
  agreements = [],
  eserviceId,
  isLoading = false,
}: {
  agreements?: bffApi.ProducerAgreement[];
  eserviceId?: EserviceId;
  isLoading?: boolean;
} = {}) {
  return renderWithProviders(
    <ProducerAgreementSection
      agreements={agreements}
      eserviceId={eserviceId}
      isLoading={isLoading}
      onEserviceIdChange={noop}
    />,
    { routes: [{ path: "/production/agreements/$id" }] },
  );
}

describe("ProducerAgreementSection", () => {
  it("renders the empty state when there are no agreements and no filters", () => {
    renderSection();

    expect(
      screen.getByText("There are no Agreements for your E-Services."),
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
        "10000000-0000-1000-8000-000000000001",
      ),
    });

    expect(
      screen.getByText("No Agreements match the selected filter."),
    ).toBeInTheDocument();
    expect(screen.getByText("E-Service")).toBeInTheDocument();
  });

  it("renders agreements table when data is available", () => {
    renderSection({ agreements: [createAgreement()] });

    expect(
      screen.getByRole("grid", { name: "Producer agreements" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Birth Certificate API")).toBeInTheDocument();
  });
});
