import type { bffApi } from "@knodia/bff-client";

import {
  type EserviceId,
  KnodeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { OrgConsumptionStatusSection } from "./OrgConsumptionStatusSection";

const defaultAgreement: bffApi.EserviceAgreementDetail = {
  id: crypto.randomUUID(),
  state: "Active",
  suspendedByConsumerAt: null,
  suspendedByProducerAt: null,
};

function renderSection({
  agreement = defaultAgreement,
  hasRecentlyBeenUpdated = false,
}: {
  agreement?: bffApi.EserviceAgreementDetail;
  hasRecentlyBeenUpdated?: boolean;
} = {}) {
  return renderWithProviders(
    <OrgConsumptionStatusSection
      agreement={agreement}
      eserviceId={unsafeBrandId<EserviceId>(crypto.randomUUID())}
      hasRecentlyBeenUpdated={hasRecentlyBeenUpdated}
      knodeId={KnodeId.enum.Lynx}
    />,
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
