import type { bffApi } from "@knodia/bff-client";
import type { UserRole } from "@knodia/common-models/auth";

import {
  type EserviceId,
  KnodeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen } from "@/test/utils";

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

const routes = [
  { path: "/consumption/e-services/$id/purposes/new" },
  { path: "/consumption/e-services/$id" },
];

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
    { roles, routes },
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

  it("shows 'Action needed' banner for PendingConsumerOperatorIdentification state", () => {
    renderSection({
      agreement: {
        id: crypto.randomUUID(),
        state: "PendingConsumerOperatorIdentification",
      },
    });

    expect(screen.getByText("Action needed")).toBeInTheDocument();
    expect(
      screen.getByText(
        "To activate the Agreement, you must log in to the Producer Knode.",
      ),
    ).toBeInTheDocument();
  });

  it("hides Purposes and Keychains sections for PendingConsumerOperatorIdentification state", () => {
    renderSection({
      agreement: {
        id: crypto.randomUUID(),
        state: "PendingConsumerOperatorIdentification",
      },
    });

    expect(screen.queryByText("Purposes")).not.toBeInTheDocument();
    expect(screen.queryByText("Keychains")).not.toBeInTheDocument();
  });

  it("shows Purposes and Keychains sections for Active state", () => {
    renderSection();

    expect(screen.getByText("Purposes")).toBeInTheDocument();
    expect(screen.getByText("Keychains")).toBeInTheDocument();
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
