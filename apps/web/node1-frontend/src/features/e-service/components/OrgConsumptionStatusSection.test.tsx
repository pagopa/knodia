import type { bffApi } from "@knodia/bff-client";
import type { UserRole } from "@knodia/common-models/auth";

import {
  type EserviceId,
  KnodeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { OrgConsumptionStatusSection } from "./OrgConsumptionStatusSection";

const AGREEMENT_ID = "10000000-0000-1000-8000-000000000001";
const KNODE_ID = KnodeId.enum.Lynx;
const BASE_URL = import.meta.env["BFF_URL"];

const defaultAgreement: bffApi.EserviceAgreementDetail = {
  id: AGREEMENT_ID,
  state: "Active",
  suspendedByConsumerAt: null,
  suspendedByProducerAt: null,
};

function renderSection({
  agreement = defaultAgreement,
  hasRecentlyBeenUpdated = false,
  roles,
}: {
  agreement?: bffApi.EserviceAgreementDetail;
  hasRecentlyBeenUpdated?: boolean;
  roles?: readonly UserRole[];
} = {}) {
  return renderWithProviders(
    <OrgConsumptionStatusSection
      agreement={agreement}
      eserviceId={unsafeBrandId<EserviceId>(crypto.randomUUID())}
      hasRecentlyBeenUpdated={hasRecentlyBeenUpdated}
      knodeId={KNODE_ID}
    />,
    { roles },
  );
}

describe("OrgConsumptionStatusSection", () => {
  it("renders the section title", () => {
    renderSection();

    expect(
      screen.getByText("Your Org's consumption status"),
    ).toBeInTheDocument();
  });

  it("renders recently updated chip when hasRecentlyBeenUpdated is true", () => {
    renderSection({ hasRecentlyBeenUpdated: true });

    expect(screen.getByText("Recent update")).toBeInTheDocument();
  });

  it("does not render recently updated chip when hasRecentlyBeenUpdated is false", () => {
    renderSection({ hasRecentlyBeenUpdated: false });

    expect(screen.queryByText("Recent update")).not.toBeInTheDocument();
  });
});

describe("OrgConsumptionStatusSection — Active state", () => {
  it("renders Suspend action for administrative users", () => {
    renderSection();

    expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument();
  });

  it("hides Suspend action for technical-only users", () => {
    renderSection({ roles: ["technical"] });

    expect(
      screen.queryByRole("button", { name: "Suspend" }),
    ).not.toBeInTheDocument();
  });

  it("opens the suspend confirmation modal when Suspend is clicked", async () => {
    const { user } = renderSection();

    await user.click(screen.getByRole("button", { name: "Suspend" }));

    expect(screen.getByText("Suspend Agreement")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Suspend anyway" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls the suspend endpoint with the agreement id and knodeId on confirm", async () => {
    let capturedKnodeId: null | string = null;

    server.use(
      http.post(
        `${BASE_URL}/consumer/agreements/${AGREEMENT_ID}/suspend`,
        ({ request }) => {
          capturedKnodeId = new URL(request.url).searchParams.get("knodeId");
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    const { user } = renderSection();

    await user.click(screen.getByRole("button", { name: "Suspend" }));
    await user.click(screen.getByRole("button", { name: "Suspend anyway" }));

    expect(capturedKnodeId).toBe(KNODE_ID);
  });
});

describe("OrgConsumptionStatusSection — Suspended state", () => {
  it("renders the 'Suspended by Producer' banner without Reactivate when producer suspended", () => {
    renderSection({
      agreement: {
        ...defaultAgreement,
        state: "Suspended",
        suspendedByProducerAt: "2026-01-01T00:00:00Z",
      },
    });

    expect(screen.getByText("Suspended by Producer")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reactivate" }),
    ).not.toBeInTheDocument();
  });

  it("renders the 'Suspended by Producer' banner when both parties suspended", () => {
    renderSection({
      agreement: {
        ...defaultAgreement,
        state: "Suspended",
        suspendedByConsumerAt: "2026-01-01T00:00:00Z",
        suspendedByProducerAt: "2026-01-02T00:00:00Z",
      },
    });

    expect(screen.getByText("Suspended by Producer")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reactivate" }),
    ).not.toBeInTheDocument();
  });

  it("renders Reactivate action when only the consumer suspended", () => {
    renderSection({
      agreement: {
        ...defaultAgreement,
        state: "Suspended",
        suspendedByConsumerAt: "2026-01-01T00:00:00Z",
      },
    });

    expect(
      screen.getByRole("button", { name: "Reactivate" }),
    ).toBeInTheDocument();
  });

  it("hides Reactivate action for technical-only users", () => {
    renderSection({
      agreement: {
        ...defaultAgreement,
        state: "Suspended",
        suspendedByConsumerAt: "2026-01-01T00:00:00Z",
      },
      roles: ["technical"],
    });

    expect(
      screen.queryByRole("button", { name: "Reactivate" }),
    ).not.toBeInTheDocument();
  });

  it("calls the reactivate endpoint when Reactivate is clicked", async () => {
    let capturedKnodeId: null | string = null;

    server.use(
      http.post(
        `${BASE_URL}/consumer/agreements/${AGREEMENT_ID}/reactivate`,
        ({ request }) => {
          capturedKnodeId = new URL(request.url).searchParams.get("knodeId");
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    const { user } = renderSection({
      agreement: {
        ...defaultAgreement,
        state: "Suspended",
        suspendedByConsumerAt: "2026-01-01T00:00:00Z",
      },
    });

    await user.click(screen.getByRole("button", { name: "Reactivate" }));

    expect(capturedKnodeId).toBe(KNODE_ID);
  });
});

describe("OrgConsumptionStatusSection — suspend modal lifecycle", () => {
  it("does not reopen the suspend modal after suspend → reactivate", async () => {
    const suspendHandler = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.post(
        `${BASE_URL}/consumer/agreements/${AGREEMENT_ID}/suspend`,
        suspendHandler,
      ),
    );

    const eserviceId = unsafeBrandId<EserviceId>(crypto.randomUUID());

    const { rerender, user } = renderWithProviders(
      <OrgConsumptionStatusSection
        agreement={defaultAgreement}
        eserviceId={eserviceId}
        hasRecentlyBeenUpdated={false}
        knodeId={KNODE_ID}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Suspend" }));
    await user.click(screen.getByRole("button", { name: "Suspend anyway" }));

    await waitFor(() => {
      expect(suspendHandler).toHaveBeenCalledTimes(1);
    });

    rerender(
      <OrgConsumptionStatusSection
        agreement={{
          ...defaultAgreement,
          state: "Suspended",
          suspendedByConsumerAt: "2026-01-01T00:00:00Z",
        }}
        eserviceId={eserviceId}
        hasRecentlyBeenUpdated={false}
        knodeId={KNODE_ID}
      />,
    );

    rerender(
      <OrgConsumptionStatusSection
        agreement={defaultAgreement}
        eserviceId={eserviceId}
        hasRecentlyBeenUpdated={false}
        knodeId={KNODE_ID}
      />,
    );

    expect(screen.queryByText("Suspend Agreement")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Suspend anyway" }),
    ).not.toBeInTheDocument();
  });
});
