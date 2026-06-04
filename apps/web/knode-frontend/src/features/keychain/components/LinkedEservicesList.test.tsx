import type { bffApi } from "@knodia/bff-client";

import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { LinkedEservicesList } from "./LinkedEservicesList";

function createEservice(
  overrides?: Partial<bffApi.ProducerKeychainEservice>,
): bffApi.ProducerKeychainEservice {
  return {
    categories: [{ code: "main-address", scheme: "eu-categories" }],
    id: crypto.randomUUID(),
    linkedAt: "2026-04-14T12:00:00.000Z",
    mode: "ProvideData",
    name: { en: "Test E-Service" },
    state: "Active",
    ...overrides,
  };
}

function renderList(props: {
  eservices: bffApi.ProducerKeychainEservice[];
  isLoading: boolean;
}) {
  return renderWithProviders(<LinkedEservicesList {...props} />, {
    routes: [
      { path: "/production/e-services" },
      { path: "/production/e-services/$id" },
    ],
  });
}

describe("LinkedEservicesList", () => {
  it("renders a loader while loading", () => {
    renderList({ eservices: [], isLoading: true });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the empty-state banner with a link to the E-Services list", () => {
    renderList({ eservices: [], isLoading: false });

    expect(
      screen.getByText("There are no E-Services linked to this Keychain yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to E-Services list" }),
    ).toBeInTheDocument();
  });

  it("renders a card per linked e-service with its state chip", () => {
    renderList({
      eservices: [
        createEservice({ name: { en: "Available One" }, state: "Active" }),
        createEservice({ name: { en: "Suspended One" }, state: "Suspended" }),
      ],
      isLoading: false,
    });

    expect(screen.getByText("Available One")).toBeInTheDocument();
    expect(screen.getByText("Suspended One")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Go to e-service" }),
    ).toHaveLength(2);
  });
});
