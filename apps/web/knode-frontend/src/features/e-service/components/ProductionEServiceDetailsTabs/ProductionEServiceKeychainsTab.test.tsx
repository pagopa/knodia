import type { bffApi } from "@knodia/bff-client";

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen } from "@/test/utils";

import { ProductionEserviceDetailsProvider } from "../../contexts/ProductionEserviceDetailsProvider";
import { ProductionEServiceKeychainsTab } from "./ProductionEServiceKeychainsTab";

const BASE_URL = import.meta.env["BFF_URL"];
const ESERVICE_ID = crypto.randomUUID();

const eservice = {
  id: ESERVICE_ID,
} as unknown as bffApi.ProducerEserviceDetails;

function createKeychain(overrides?: Partial<bffApi.Keychain>): bffApi.Keychain {
  return {
    id: crypto.randomUUID(),
    keysCount: 3,
    membersCount: 1,
    name: { en: "Health coverage" },
    ...overrides,
  };
}

function mockKeychains(results: bffApi.Keychain[]) {
  server.use(
    http.get(`${BASE_URL}/producerKeychains`, () =>
      HttpResponse.json({
        pagination: { limit: 50, offset: 0, total: results.length },
        results,
      }),
    ),
  );
}

function renderTab(roles: readonly ("administrative" | "technical")[]) {
  return renderWithProviders(
    <ProductionEserviceDetailsProvider eservice={eservice}>
      <ProductionEServiceKeychainsTab />
    </ProductionEserviceDetailsProvider>,
    { roles, routes: [{ path: "/keychains/production/$id" }] },
  );
}

describe("ProductionEServiceKeychainsTab", () => {
  it("shows the linked keychains and admin-only actions for administrative users", async () => {
    mockKeychains([createKeychain({ name: { en: "Health coverage" } })]);

    renderTab(["administrative"]);

    expect(await screen.findByText("Health coverage")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Link Keychain" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlink" })).toBeInTheDocument();
  });

  it("shows the admin empty state with the Link action when there are no keychains", async () => {
    mockKeychains([]);

    renderTab(["administrative"]);

    expect(
      await screen.findByText(
        "Link a Production Keychain to sign responses from the E-Service.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Link Keychain" }),
    ).toBeInTheDocument();
  });

  it("hides the Link/Unlink actions and shows the read-only empty state for technical users", async () => {
    mockKeychains([]);

    renderTab(["technical"]);

    expect(
      await screen.findByText(
        "There are no Keychains connected to this E-Service yet.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Link Keychain" }),
    ).not.toBeInTheDocument();
  });
});
