import type { bffApi } from "@knodia/bff-client";

import {
  type EserviceId,
  KnodeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ConsumptionRequirementsSection } from "./ConsumptionRequirementsSection";

const KNODE_ID = KnodeId.enum.Lynx;
const REQUEST_AGREEMENT = "Request Agreement";
const HAS_ATTRS_TEXT = "Your organization has the required attributes.";

const routes = [{ path: "/consumption/e-services/request-agreement" }];

function renderSection({
  canRequestAgreement = true,
  eserviceState = "Active",
  hasAgreement = false,
  hasRequiredAttributes = true,
  identificationRequired = false,
}: {
  canRequestAgreement?: boolean;
  eserviceState?: bffApi.EserviceVersionState;
  hasAgreement?: boolean;
  hasRequiredAttributes?: boolean;
  identificationRequired?: boolean;
} = {}) {
  return renderWithProviders(
    <ConsumptionRequirementsSection
      canRequestAgreement={canRequestAgreement}
      eserviceId={unsafeBrandId<EserviceId>(crypto.randomUUID())}
      eserviceState={eserviceState}
      hasAgreement={hasAgreement}
      hasRequiredAttributes={hasRequiredAttributes}
      identificationRequired={identificationRequired}
      knodeId={KNODE_ID}
      requiredAttributes={[]}
    />,
    { routes },
  );
}

describe("ConsumptionRequirementsSection", () => {
  it("shows the status banner and Request Agreement button for an active e-service the org can request", () => {
    renderSection();

    expect(screen.getByText(HAS_ATTRS_TEXT)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: REQUEST_AGREEMENT }),
    ).toBeInTheDocument();
  });

  it("hides the status banner and Request Agreement button for an archived e-service", () => {
    renderSection({ eserviceState: "Archived" });

    expect(screen.queryByText(HAS_ATTRS_TEXT)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: REQUEST_AGREEMENT }),
    ).not.toBeInTheDocument();
  });

  it("keeps the Attributes and Identification columns for an archived e-service", () => {
    renderSection({ eserviceState: "Archived" });

    expect(screen.getByText("Attributes")).toBeInTheDocument();
    expect(screen.getByText("Identification not required")).toBeInTheDocument();
  });

  it("hides the Request Agreement button when the org already has a live agreement", () => {
    renderSection({ hasAgreement: true });

    expect(screen.getByText(HAS_ATTRS_TEXT)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: REQUEST_AGREEMENT }),
    ).not.toBeInTheDocument();
  });

  it("hides the Request Agreement button for users who can't manage agreements", () => {
    renderSection({ canRequestAgreement: false });

    expect(
      screen.queryByRole("link", { name: REQUEST_AGREEMENT }),
    ).not.toBeInTheDocument();
  });

  it("shows a warning without the button when the org lacks the required attributes", () => {
    renderSection({ hasRequiredAttributes: false });

    expect(
      screen.getByText(
        "Your organization does not have the required attributes.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: REQUEST_AGREEMENT }),
    ).not.toBeInTheDocument();
  });
});
