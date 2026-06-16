import type { bffApi } from "@knodia/bff-client";
import type { KnodeId } from "@knodia/common-models/ids";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ProducerPurposeDetail } from "./ProducerPurposeDetail";

const KNODE_ID = "Orion" as KnodeId;
const PURPOSE_ID = "00000000-0000-4000-8000-000000000001";
const ESERVICE_ID = "00000000-0000-4000-8000-000000000002";
const PRODUCER_ID = "00000000-0000-4000-8000-000000000003";
const CONSUMER_ID = "00000000-0000-4000-8000-000000000004";
const AGREEMENT_ID = "00000000-0000-4000-8000-000000000005";

function createPurposeDetails(
  overrides?: Partial<bffApi.PurposeDetails>,
): bffApi.PurposeDetails {
  return {
    agreement: { id: AGREEMENT_ID, state: "Active" },
    consumer: { id: CONSUMER_ID, knodeId: KNODE_ID, name: "Consumer Org" },
    dailyCalls: 100,
    description: { en: "Test purpose description" },
    eservice: {
      id: ESERVICE_ID,
      latestVersionState: "Active",
      name: { en: "Test E-Service" },
    },
    id: PURPOSE_ID,
    knodeId: KNODE_ID,
    maxDailyCallsPerConsumer: 1000,
    name: { en: "Test Purpose" },
    producer: { id: PRODUCER_ID, name: "Producer Org" },
    state: "Active",
    suspendedByConsumerAt: null,
    suspendedByProducerAt: null,
    updatedAt: "2026-04-15T10:00:00Z",
    ...overrides,
  };
}

function renderDetail(purpose: bffApi.PurposeDetails = createPurposeDetails()) {
  return renderWithProviders(<ProducerPurposeDetail purpose={purpose} />, {
    routes: [
      { path: "/production/agreements/$id" },
      { path: "/production/e-services/$id" },
    ],
  });
}

describe("ProducerPurposeDetail — agreement arrow visibility", () => {
  it("renders the agreement arrow link when the agreement is not archived", () => {
    renderDetail();

    const link = screen.getByRole("link", { name: "Go to agreement" });
    expect(link).toHaveAttribute(
      "href",
      `/production/agreements/${AGREEMENT_ID}`,
    );
  });

  it("hides the agreement arrow link when the agreement is archived", () => {
    renderDetail(
      createPurposeDetails({
        agreement: { id: AGREEMENT_ID, state: "Archived" },
      }),
    );

    expect(
      screen.queryByRole("link", { name: "Go to agreement" }),
    ).not.toBeInTheDocument();
  });
});
