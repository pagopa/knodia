import type { bffApi } from "@knodia/bff-client";

import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen } from "@/test/utils";

import { LinkKeychainAction } from "./LinkKeychainAction";

const BASE_URL = import.meta.env["BFF_URL"];
const ESERVICE_ID = unsafeBrandId<EserviceId>(crypto.randomUUID());

function mockOwnedKeychains(results: bffApi.Keychain[]) {
  server.use(
    http.get(`${BASE_URL}/producerKeychains`, () =>
      HttpResponse.json({
        pagination: { limit: 10, offset: 0, total: results.length },
        results,
      }),
    ),
  );
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

  it("shows the keychain select when the organization owns Production Keychains", async () => {
    mockOwnedKeychains([
      {
        id: crypto.randomUUID(),
        keysCount: 3,
        membersCount: 1,
        name: { en: "Health coverage" },
      },
    ]);

    const { user } = renderAction();

    await user.click(screen.getByRole("button", { name: "Link Keychain" }));

    expect(await screen.findByText("Production Keychains")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Link" })).toBeInTheDocument();
  });
});
