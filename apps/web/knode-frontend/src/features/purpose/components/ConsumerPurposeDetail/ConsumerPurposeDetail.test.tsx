import type { bffApi } from "@knodia/bff-client";
import type { KnodeId } from "@knodia/common-models/ids";

import { within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { ConsumerPurposeDetail } from "./ConsumerPurposeDetail";

const BASE_URL = import.meta.env["BFF_URL"];
const KNODE_ID = "Orion" as KnodeId;
const PURPOSE_ID = "00000000-0000-4000-8000-000000000001";
const ESERVICE_ID = "00000000-0000-4000-8000-000000000002";
const PRODUCER_ID = "00000000-0000-4000-8000-000000000003";
const CONSUMER_ID = "00000000-0000-4000-8000-000000000004";
const AGREEMENT_ID = "00000000-0000-4000-8000-000000000005";

const basePurpose: bffApi.PurposeDetails = {
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
  maxDailyCallsPerConsumer: 1000,
  name: { en: "Test Purpose" },
  producer: { id: PRODUCER_ID, knodeId: KNODE_ID, name: "Producer Org" },
  state: "Active",
  suspendedByConsumerAt: null,
  suspendedByProducerAt: null,
  updatedAt: "2026-04-15T10:00:00Z",
};

const suspendedByConsumer: bffApi.PurposeDetails = {
  ...basePurpose,
  state: "Suspended",
  suspendedByConsumerAt: "2026-04-20T10:00:00Z",
};

function mockEmptyKeychains() {
  server.use(
    http.get(`${BASE_URL}/consumer/keychains`, () =>
      HttpResponse.json({
        pagination: { limit: 10, offset: 0, total: 0 },
        results: [],
      }),
    ),
  );
}

describe("ConsumerPurposeDetail — action button gating", () => {
  it("shows Suspend on Active purposes; no Reactivate/Archive; no producer banner", () => {
    mockEmptyKeychains();

    renderWithProviders(
      <ConsumerPurposeDetail knodeId={KNODE_ID} purpose={basePurpose} />,
    );

    expect(screen.getByRole("button", { name: "Suspend" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Reactivate" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Archive" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("The Producer suspended this Purpose"),
    ).not.toBeInTheDocument();
  });

  it("shows Reactivate and Archive on consumer-suspended purposes; no banner", () => {
    mockEmptyKeychains();

    renderWithProviders(
      <ConsumerPurposeDetail
        knodeId={KNODE_ID}
        purpose={suspendedByConsumer}
      />,
    );

    expect(screen.getByRole("button", { name: "Reactivate" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Archive" })).toBeVisible();
    expect(
      screen.queryByText("The Producer suspended this Purpose"),
    ).not.toBeInTheDocument();
  });

  it("shows only Archive on producer-suspended purposes; banner is shown", () => {
    mockEmptyKeychains();

    renderWithProviders(
      <ConsumerPurposeDetail
        knodeId={KNODE_ID}
        purpose={{
          ...basePurpose,
          state: "Suspended",
          suspendedByProducerAt: "2026-04-20T10:00:00Z",
        }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Reactivate" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive" })).toBeVisible();
    expect(
      screen.getByText("The Producer suspended this Purpose"),
    ).toBeVisible();
  });

  it("shows Reactivate + Archive when both have suspended; banner hidden", () => {
    mockEmptyKeychains();

    renderWithProviders(
      <ConsumerPurposeDetail
        knodeId={KNODE_ID}
        purpose={{
          ...basePurpose,
          state: "Suspended",
          suspendedByConsumerAt: "2026-04-20T10:00:00Z",
          suspendedByProducerAt: "2026-04-20T10:00:00Z",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Reactivate" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Archive" })).toBeVisible();
    expect(
      screen.queryByText("The Producer suspended this Purpose"),
    ).not.toBeInTheDocument();
  });

  it("renders no action buttons on Archived purposes; shows Archived chip; no banner; keychains section still visible", () => {
    mockEmptyKeychains();

    renderWithProviders(
      <ConsumerPurposeDetail
        knodeId={KNODE_ID}
        purpose={{
          ...basePurpose,
          state: "Archived",
          suspendedByConsumerAt: "2026-04-20T10:00:00Z",
          suspendedByProducerAt: "2026-04-20T10:00:00Z",
          updatedAt: "2026-04-25T10:00:00Z",
        }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Suspend" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reactivate" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Archive" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("The Producer suspended this Purpose"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/^Archived /)).toBeVisible();
    expect(screen.getByText("Keychains")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Link Keychain" }),
    ).not.toBeInTheDocument();
  });
});

describe("ConsumerPurposeDetail — archive flow", () => {
  it("opens the modal with Figma copy and calls archive on confirm", async () => {
    mockEmptyKeychains();
    const archiveHandler = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.post(
        `${BASE_URL}/consumer/purposes/:purposeId/archive`,
        archiveHandler,
      ),
    );

    const { user } = renderWithProviders(
      <ConsumerPurposeDetail
        knodeId={KNODE_ID}
        purpose={suspendedByConsumer}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(await screen.findByText("Archive Purpose")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to archive this Purpose\?/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This action cannot be undone\./),
    ).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Archive" }));

    await waitFor(() => {
      expect(archiveHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("does not call archive when cancelling the modal", async () => {
    mockEmptyKeychains();
    const archiveHandler = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.post(
        `${BASE_URL}/consumer/purposes/:purposeId/archive`,
        archiveHandler,
      ),
    );

    const { user } = renderWithProviders(
      <ConsumerPurposeDetail
        knodeId={KNODE_ID}
        purpose={suspendedByConsumer}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(await screen.findByText("Archive Purpose")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(archiveHandler).not.toHaveBeenCalled();
  });

  it("shows the error banner when the archive mutation fails", async () => {
    mockEmptyKeychains();
    server.use(
      http.post(
        `${BASE_URL}/consumer/purposes/:purposeId/archive`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { user } = renderWithProviders(
      <ConsumerPurposeDetail
        knodeId={KNODE_ID}
        purpose={suspendedByConsumer}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Archive" }));

    expect(
      await screen.findByText(/Something went wrong/i),
    ).toBeInTheDocument();
  });
});
