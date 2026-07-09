import type { KnodeId } from "@knodia/common-models/ids";

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen } from "@/test/utils";

import { LinkConsumerKeychainAction } from "./LinkConsumerKeychainAction";

const BASE_URL = import.meta.env["BFF_URL"];
const KNODE_ID = "Orion" as KnodeId;
const PURPOSE_ID = "00000000-0000-4000-8000-000000000001";

const keychainOption = {
  id: "11111111-1111-4000-8000-000000000001",
  name: { en: "My Keychain" },
};

// Branch on the search term `q`: an owned keychain matches only the empty query,
// so a non-matching search returns an empty page (total 0) without meaning the
// user owns none.
function mockKeychainOptions({ ownsKeychains }: { ownsKeychains: boolean }) {
  server.use(
    http.get(`${BASE_URL}/consumerKeychains/options`, ({ request }) => {
      const q = new URL(request.url).searchParams.get("q") ?? "";
      const results = ownsKeychains && q === "" ? [keychainOption] : [];
      return HttpResponse.json({
        pagination: { limit: 20, offset: 0, total: results.length },
        results,
      });
    }),
  );
}

function renderAction() {
  return renderWithProviders(
    <LinkConsumerKeychainAction knodeId={KNODE_ID} purposeId={PURPOSE_ID} />,
  );
}

describe("LinkConsumerKeychainAction — empty-state feedback", () => {
  it("shows the 'no keychains yet' banner only when the user owns none", async () => {
    mockKeychainOptions({ ownsKeychains: false });
    const { user } = renderAction();

    await user.click(screen.getByRole("button", { name: "Link Keychain" }));

    expect(
      await screen.findByText("You don't have any Consumption Keychain yet"),
    ).toBeVisible();
    expect(
      screen.queryByRole("combobox", { name: "Consumption Keychains" }),
    ).not.toBeInTheDocument();
  });

  it("shows the ComboBox (not the banner) when the user owns keychains", async () => {
    mockKeychainOptions({ ownsKeychains: true });
    const { user } = renderAction();

    await user.click(screen.getByRole("button", { name: "Link Keychain" }));

    expect(
      await screen.findByRole("combobox", { name: "Consumption Keychains" }),
    ).toBeVisible();
    expect(
      screen.queryByText("You don't have any Consumption Keychain yet"),
    ).not.toBeInTheDocument();
  });

  it("shows 'No results found', not the banner, when a search matches nothing", async () => {
    mockKeychainOptions({ ownsKeychains: true });
    const { user } = renderAction();

    await user.click(screen.getByRole("button", { name: "Link Keychain" }));
    const combobox = await screen.findByRole("combobox", {
      name: "Consumption Keychains",
    });

    await user.type(combobox, "zzz");

    expect(await screen.findByText("No results found")).toBeVisible();
    expect(
      screen.queryByText("You don't have any Consumption Keychain yet"),
    ).not.toBeInTheDocument();
  });
});
