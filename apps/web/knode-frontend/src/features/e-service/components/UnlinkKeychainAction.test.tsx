import type { bffApi } from "@knodia/bff-client";

import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { UnlinkKeychainAction } from "./UnlinkKeychainAction";

const BASE_URL = import.meta.env["BFF_URL"];
const ESERVICE_ID = unsafeBrandId<EserviceId>(crypto.randomUUID());

const keychain: bffApi.Keychain = {
  id: crypto.randomUUID(),
  keysCount: 3,
  membersCount: 1,
  name: { en: "Health coverage" },
};

describe("UnlinkKeychainAction", () => {
  it("confirms and calls the unlink endpoint", async () => {
    const unlinkHandler = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.delete(
        `${BASE_URL}/producerKeychains/:producerKeychainId/eservices/:eserviceId`,
        unlinkHandler,
      ),
    );

    const { user } = renderWithProviders(
      <UnlinkKeychainAction eserviceId={ESERVICE_ID} keychain={keychain} />,
    );

    await user.click(screen.getByRole("button", { name: "Unlink" }));

    expect(await screen.findByText("Unlink Keychain")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Unlink anyway" }));

    await waitFor(() => {
      expect(unlinkHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("does not call the unlink endpoint when cancelling", async () => {
    const unlinkHandler = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.delete(
        `${BASE_URL}/producerKeychains/:producerKeychainId/eservices/:eserviceId`,
        unlinkHandler,
      ),
    );

    const { user } = renderWithProviders(
      <UnlinkKeychainAction eserviceId={ESERVICE_ID} keychain={keychain} />,
    );

    await user.click(screen.getByRole("button", { name: "Unlink" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(unlinkHandler).not.toHaveBeenCalled();
  });
});
