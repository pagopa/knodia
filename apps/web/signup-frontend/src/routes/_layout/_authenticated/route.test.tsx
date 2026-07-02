import { QueryClient } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

import { APP_BASE_PATH } from "@/config/basepath";
import { LOGIN_ROUTE } from "@/libs/auth";
import { type OnboardingStatus } from "@/services/onboarding";
import { getCurrentSignupUserQuery } from "@/services/queries";
import { createTestRouterFromFiles } from "@/test/file-route-utils";

const createTestRouter = (
  isAuthenticated: boolean,
  onboardingStatus: OnboardingStatus = "ACTIVE",
) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(getCurrentSignupUserQuery().queryKey, {
    email: "user@example.com",
    knodes: [
      { knode: "Orion", organizationName: "Example Org", username: "user" },
    ],
    onboardingStatus,
    termsAcceptedAt: "2026-01-01T00:00:00.000Z",
  });

  return createTestRouterFromFiles({
    initialLocation: "/home",
    isServer: true,
    routerContext: {
      auth: {
        isAuthenticated,
        logout: vi.fn(),
      },
      queryClient,
    },
  });
};

describe("authenticated route", () => {
  it("redirects unauthenticated users to login", async () => {
    const router = createTestRouter(false);

    await router.load();

    expect(isRedirect(router.state.redirect)).toBe(true);
    expect(router.state.redirect?.options.to).toBe(LOGIN_ROUTE);
    expect(router.state.redirect?.headers.get("Location")).toBe(
      `${APP_BASE_PATH}${LOGIN_ROUTE}`,
    );
  });

  it("allows authenticated users to access the route", async () => {
    const router = createTestRouter(true);

    await router.load();

    expect(router.state.redirect).toBeUndefined();
    expect(router.state.location.pathname).toBe("/home");
  });

  it("redirects users still onboarding away from /home", async () => {
    const router = createTestRouter(true, "NOT_COMPLETED");

    await router.load();

    expect(isRedirect(router.state.redirect)).toBe(true);
    expect(router.state.redirect?.options.to).toBe("/registration");
  });

  it("redirects suspended users to /suspended", async () => {
    const router = createTestRouter(true, "SUSPENDED");

    await router.load();

    expect(isRedirect(router.state.redirect)).toBe(true);
    expect(router.state.redirect?.options.to).toBe("/suspended");
  });
});
