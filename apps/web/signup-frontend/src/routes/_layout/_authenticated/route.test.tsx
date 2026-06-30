import { QueryClient } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

import { APP_BASE_PATH } from "@/config/basepath";
import { LOGIN_ROUTE } from "@/libs/auth";
import { getCurrentSignupUserQuery } from "@/services/queries";
import { createTestRouterFromFiles } from "@/test/file-route-utils";

const createTestRouter = (isAuthenticated: boolean) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(getCurrentSignupUserQuery().queryKey, {
    email: "user@example.com",
    knodes: [
      { knode: "Orion", organizationName: "Example Org", username: "user" },
    ],
    onboardingStatus: "ACTIVE",
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
});
