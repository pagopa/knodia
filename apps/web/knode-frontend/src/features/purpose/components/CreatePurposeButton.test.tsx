import {
  type EserviceId,
  KnodeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { CreatePurposeButton } from "./CreatePurposeButton";

const ESERVICE_ID = unsafeBrandId<EserviceId>(
  "10000000-0000-4000-8000-000000000001",
);
const KNODE_ID = KnodeId.enum.Orion;

const routes = [
  { path: "/consumption/e-services/$id/purposes/new" },
  { path: "/consumption/e-services/$id/purposes/from-template" },
  { path: "/consumption/e-services/$id" },
];

describe("CreatePurposeButton — isBlocked", () => {
  it("renders a single button (no dropdown) when isBlocked, even with ProvideData mode", () => {
    renderWithProviders(
      <CreatePurposeButton
        eserviceId={ESERVICE_ID}
        eserviceMode="ProvideData"
        isBlocked
        knodeId={KNODE_ID}
        onBlockedPress={() => undefined}
      />,
      { routes },
    );

    expect(
      screen.getByRole("button", { name: "Create Purpose" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "From scratch" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "From template" }),
    ).not.toBeInTheDocument();
  });

  it("calls onBlockedPress when the button is clicked", async () => {
    const onBlockedPress = vi.fn();
    const { user } = renderWithProviders(
      <CreatePurposeButton
        eserviceId={ESERVICE_ID}
        eserviceMode="ProvideData"
        isBlocked
        knodeId={KNODE_ID}
        onBlockedPress={onBlockedPress}
      />,
      { routes },
    );

    await user.click(screen.getByRole("button", { name: "Create Purpose" }));

    expect(onBlockedPress).toHaveBeenCalledTimes(1);
  });

  it("does not navigate when blocked even if eserviceMode is ReceiveData", async () => {
    const onBlockedPress = vi.fn();
    const { router, user } = renderWithProviders(
      <CreatePurposeButton
        eserviceId={ESERVICE_ID}
        eserviceMode="ReceiveData"
        isBlocked
        knodeId={KNODE_ID}
        onBlockedPress={onBlockedPress}
      />,
      { routes },
    );

    await user.click(screen.getByRole("button", { name: "Create Purpose" }));

    expect(onBlockedPress).toHaveBeenCalledTimes(1);
    expect(router.state.location.pathname).toBe("/");
  });
});

describe("CreatePurposeButton — eserviceMode", () => {
  it("renders a direct link (no dropdown) when eserviceMode is ReceiveData", () => {
    renderWithProviders(
      <CreatePurposeButton
        eserviceId={ESERVICE_ID}
        eserviceMode="ReceiveData"
        isBlocked={false}
        knodeId={KNODE_ID}
        onBlockedPress={() => undefined}
      />,
      { routes },
    );

    const link = screen.getByRole("link", { name: "Create Purpose" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      `/consumption/e-services/${ESERVICE_ID}/purposes/new?knodeId=${KNODE_ID}`,
    );
    expect(
      screen.queryByRole("menuitem", { name: "From template" }),
    ).not.toBeInTheDocument();
  });

  it("renders a dropdown trigger (no link, no direct nav) when eserviceMode is ProvideData", async () => {
    const { user } = renderWithProviders(
      <CreatePurposeButton
        eserviceId={ESERVICE_ID}
        eserviceMode="ProvideData"
        isBlocked={false}
        knodeId={KNODE_ID}
        onBlockedPress={() => undefined}
      />,
      { routes },
    );

    expect(
      screen.queryByRole("link", { name: "Create Purpose" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Create Purpose/ }));

    expect(
      screen.getByRole("menuitem", { name: "From scratch" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "From template" }),
    ).toBeInTheDocument();
  });

  it("navigates to /purposes/from-template when 'From template' is selected", async () => {
    const { router, user } = renderWithProviders(
      <CreatePurposeButton
        eserviceId={ESERVICE_ID}
        eserviceMode="ProvideData"
        isBlocked={false}
        knodeId={KNODE_ID}
        onBlockedPress={() => undefined}
      />,
      { routes },
    );

    await user.click(screen.getByRole("button", { name: /Create Purpose/ }));
    await user.click(screen.getByRole("menuitem", { name: "From template" }));

    expect(router.state.location.pathname).toBe(
      `/consumption/e-services/${ESERVICE_ID}/purposes/from-template`,
    );
    expect(router.state.location.search).toMatchObject({
      knodeId: KNODE_ID,
    });
  });

  it("navigates to /purposes/new without from=template when 'From scratch' is selected", async () => {
    const { router, user } = renderWithProviders(
      <CreatePurposeButton
        eserviceId={ESERVICE_ID}
        eserviceMode="ProvideData"
        isBlocked={false}
        knodeId={KNODE_ID}
        onBlockedPress={() => undefined}
      />,
      { routes },
    );

    await user.click(screen.getByRole("button", { name: /Create Purpose/ }));
    await user.click(screen.getByRole("menuitem", { name: "From scratch" }));

    expect(router.state.location.pathname).toBe(
      `/consumption/e-services/${ESERVICE_ID}/purposes/new`,
    );
    expect(router.state.location.search).toMatchObject({ knodeId: KNODE_ID });
    expect(router.state.location.search).not.toHaveProperty("from");
  });
});
