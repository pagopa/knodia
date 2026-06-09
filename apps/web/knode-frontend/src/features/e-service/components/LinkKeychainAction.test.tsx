import type { bffApi } from "@knodia/bff-client";

import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { LinkKeychainAction } from "./LinkKeychainAction";

const BASE_URL = import.meta.env["BFF_URL"];
const ESERVICE_ID = unsafeBrandId<EserviceId>(crypto.randomUUID());

function createKeychain(overrides?: Partial<bffApi.Keychain>): bffApi.Keychain {
  return {
    id: crypto.randomUUID(),
    keysCount: 3,
    membersCount: 1,
    name: { en: "Health coverage" },
    ...overrides,
  };
}

function mockOwnedKeychains(results: bffApi.Keychain[]) {
  server.use(
    http.get(`${BASE_URL}/producerKeychains`, () =>
      HttpResponse.json({
        pagination: { limit: 50, offset: 0, total: results.length },
        results,
      }),
    ),
  );
}

async function openSelect(user: ReturnType<typeof renderAction>["user"]) {
  await user.click(screen.getByRole("button", { name: "Link Keychain" }));
  const trigger = await screen.findByRole("button", {
    name: /Production Keychains/i,
  });
  await user.click(trigger);
  await waitFor(() => {
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
}

function renderAction(linkedKeychainIds: string[] = []) {
  return renderWithProviders(
    <LinkKeychainAction
      eserviceId={ESERVICE_ID}
      linkedKeychainIds={linkedKeychainIds}
    />,
    { routes: [{ path: "/keychains" }] },
  );
}

describe("LinkKeychainAction", () => {
  it("shows the empty state when the organization has no Production Keychain", async () => {
    mockOwnedKeychains([]);

    const { user } = renderAction();

    await user.click(screen.getByRole("button", { name: "Link Keychain" }));

    expect(
      await screen.findByText("You don't have any Production Keychain yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to Keychains page" }),
    ).toBeInTheDocument();
  });

  it("lists all keychains, including ones already linked to the e-service", async () => {
    const linked = createKeychain({ name: { en: "Health coverage" } });
    mockOwnedKeychains([linked]);

    const { user } = renderAction([linked.id]);

    await openSelect(user);

    expect(
      screen.getByRole("option", { name: "Health coverage" }),
    ).toBeInTheDocument();
  });

  it("blocks the link and shows an error when the selected keychain is already linked", async () => {
    const linkHandler = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.post(
        `${BASE_URL}/producerKeychains/:producerKeychainId/eservices`,
        linkHandler,
      ),
    );
    const linked = createKeychain({ name: { en: "Health coverage" } });
    mockOwnedKeychains([linked]);

    const { user } = renderAction([linked.id]);

    await openSelect(user);
    await user.click(screen.getByRole("option", { name: "Health coverage" }));
    await user.click(screen.getByRole("button", { name: "Link" }));

    expect(
      await screen.findByText(
        "This Keychain is already linked to this E-service.",
      ),
    ).toBeInTheDocument();
    expect(linkHandler).not.toHaveBeenCalled();
  });

  it("links a keychain that is not already linked", async () => {
    const linkHandler = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.post(
        `${BASE_URL}/producerKeychains/:producerKeychainId/eservices`,
        linkHandler,
      ),
    );
    const keychain = createKeychain({ name: { en: "Maintenance" } });
    mockOwnedKeychains([keychain]);

    const { user } = renderAction([]);

    await openSelect(user);
    await user.click(screen.getByRole("option", { name: "Maintenance" }));
    await user.click(screen.getByRole("button", { name: "Link" }));

    await waitFor(() => {
      expect(linkHandler).toHaveBeenCalledTimes(1);
    });
  });
});
