import type { bffApi } from "@knodia/bff-client";

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen } from "@/test/utils";

import { ProducerAgreementDetail } from "./ProducerAgreementDetail";

function createAgreementDetails(
  overrides?: Partial<bffApi.ProducerAgreementDetails>,
): bffApi.ProducerAgreementDetails {
  return {
    consumer: {
      id: "20000000-0000-1000-8000-000000000001",
      knodeId: "Lynx",
      name: "Ursa Major",
    },
    eservice: {
      id: "30000000-0000-1000-8000-000000000001",
      name: { en: "Birth Certificate API" },
    },
    id: "10000000-0000-1000-8000-000000000001",
    latestEserviceVersionState: "Active",
    producer: {
      id: "40000000-0000-1000-8000-000000000001",
      knodeId: "Orion",
      name: "Rigel Corp",
    },
    state: "Active",
    ...overrides,
  };
}

const BASE_URL = import.meta.env["BFF_URL"];

function renderDetail(
  agreement: bffApi.ProducerAgreementDetails = createAgreementDetails(),
) {
  return renderWithProviders(
    <ProducerAgreementDetail agreement={agreement} />,
    {
      routes: [
        { path: "/production/e-services/$id" },
        { path: "/production/purposes/$id" },
      ],
    },
  );
}

describe("ProducerAgreementDetail", () => {
  it("renders agreement information correctly", () => {
    renderDetail();

    expect(screen.getByText("Agreement request")).toBeInTheDocument();
    expect(screen.getByText("Birth Certificate API")).toBeInTheDocument();
    expect(screen.getByText("Rigel Corp")).toBeInTheDocument();
    expect(screen.getByText("Ursa Major")).toBeInTheDocument();
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
    const eserviceId = "50000000-0000-1000-8000-000000000042";
    renderDetail(
      createAgreementDetails({
        eservice: { id: eserviceId, name: { en: "Tax Registry API" } },
      }),
    );

    const link = screen.getByRole("link", { name: "Tax Registry API" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      `/production/e-services/${eserviceId}`,
    );
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

  it("hides Suspend button for technical-only users when agreement is active", () => {
    renderWithProviders(
      <ProducerAgreementDetail agreement={createAgreementDetails()} />,
      {
        roles: ["technical"],
        routes: [{ path: "/production/e-services/$id" }],
      },
    );

    expect(
      screen.queryByRole("button", { name: "Suspend" }),
    ).not.toBeInTheDocument();
  });

  it("hides Reactivate button for technical-only users when agreement is suspended", () => {
    renderWithProviders(
      <ProducerAgreementDetail
        agreement={createAgreementDetails({ state: "Suspended" })}
      />,
      {
        roles: ["technical"],
        routes: [{ path: "/production/e-services/$id" }],
      },
    );

    expect(
      screen.queryByRole("button", { name: "Reactivate" }),
    ).not.toBeInTheDocument();
  });

  describe("Purposes section", () => {
    it("renders the Purposes heading", async () => {
      renderDetail();

      expect(
        await screen.findByRole("heading", { name: "Purposes" }),
      ).toBeInTheDocument();
    });

    it("renders empty state banner when there are no purposes", async () => {
      renderDetail();

      expect(
        await screen.findByText(
          "You don't have any Purpose for this Agreement.",
        ),
      ).toBeInTheDocument();
    });

    it("renders purposes table with data", async () => {
      const purposeId1 = "60000000-0000-1000-8000-000000000001";
      const purposeId2 = "60000000-0000-1000-8000-000000000002";

      const purposes: bffApi.ProducerPurpose[] = [
        {
          consumer: {
            id: "20000000-0000-1000-8000-000000000001",
            knodeId: "Lynx",
            name: "Ursa Major",
          },
          dailyCalls: 100,
          description: { en: "Freedom of movement" },
          eservice: {
            id: "30000000-0000-1000-8000-000000000001",
            name: { en: "Birth Certificate API" },
          },
          id: purposeId1,
          name: { en: "UE freedom of movement" },
          state: "Active",
        },
        {
          consumer: {
            id: "20000000-0000-1000-8000-000000000001",
            knodeId: "Lynx",
            name: "Ursa Major",
          },
          dailyCalls: 1000,
          description: { en: "Social security" },
          eservice: {
            id: "30000000-0000-1000-8000-000000000001",
            name: { en: "Birth Certificate API" },
          },
          id: purposeId2,
          name: { en: "Cross-border social security coordination" },
          state: "Suspended",
        },
      ];

      server.use(
        http.get(`${BASE_URL}/producer/purposes`, () =>
          HttpResponse.json({
            pagination: { limit: 50, offset: 0, total: 2 },
            results: purposes,
          }),
        ),
      );

      renderDetail();

      expect(
        await screen.findByText("UE freedom of movement"),
      ).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(
        screen.getByText("Cross-border social security coordination"),
      ).toBeInTheDocument();
      expect(screen.getByText((1000).toLocaleString())).toBeInTheDocument();

      const purposeLinks = screen.getAllByRole("link", {
        name: "Go to purpose",
      });
      expect(purposeLinks).toHaveLength(2);
      expect(purposeLinks.at(0)).toHaveAttribute(
        "href",
        `/production/purposes/${purposeId1}`,
      );
      expect(purposeLinks.at(1)).toHaveAttribute(
        "href",
        `/production/purposes/${purposeId2}`,
      );
    });
  });
});
