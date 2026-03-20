import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { ProducerAgreementDetail } from "./ProducerAgreementDetail";

function createAgreementDetails(
  overrides?: Partial<bffApi.ProducerAgreementDetails>,
): bffApi.ProducerAgreementDetails {
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
    id: "agreement-1",
    latestEserviceVersionState: "Active",
    producer: {
      id: "producer-1",
      knodeId: "Orion",
      name: "Rigel Corp",
    },
    state: "Active",
    ...overrides,
  };
}

function renderDetail(
  agreement: bffApi.ProducerAgreementDetails = createAgreementDetails(),
) {
  return renderWithProviders(
    <ProducerAgreementDetail agreement={agreement} />,
    { routes: [{ path: "/production/e-services/$id" }] },
  );
}

describe("ProducerAgreementDetail", () => {
  it("renders agreement information correctly", () => {
    renderDetail();

    expect(screen.getByText("Agreement request")).toBeInTheDocument();
    expect(screen.getByText("Birth Certificate API")).toBeInTheDocument();
    expect(screen.getByText("Rigel Corp - Orion Knode")).toBeInTheDocument();
    expect(screen.getByText("Ursa Major - Lynx Knode")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders the Suspend button as disabled when agreement is active", () => {
    renderDetail();

    const suspendButton = screen.getByRole("button", { name: "Suspend" });
    expect(suspendButton).toBeDisabled();
  });

  it("renders the Reactivate button as disabled when agreement is suspended", () => {
    renderDetail(createAgreementDetails({ state: "Suspended" }));

    const reactivateButton = screen.getByRole("button", {
      name: "Reactivate",
    });
    expect(reactivateButton).toBeDisabled();
  });

  it("renders a link to the eservice detail page", () => {
    renderDetail(
      createAgreementDetails({
        eservice: { id: "eservice-42", name: { en: "Tax Registry API" } },
      }),
    );

    const link = screen.getByRole("link", { name: "Tax Registry API" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/production/e-services/eservice-42");
  });

  it("renders the Suspended state chip", () => {
    renderDetail(createAgreementDetails({ state: "Suspended" }));

    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("renders the eservice state chip", () => {
    renderDetail();

    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("renders the consumer contact popover button", () => {
    renderDetail();

    const contactButton = screen.getByRole("button", {
      name: "View contact info",
    });
    expect(contactButton).toBeInTheDocument();
  });
});
