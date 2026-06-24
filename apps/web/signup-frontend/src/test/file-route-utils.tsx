import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { type RenderOptions } from "@testing-library/react";

import { APP_BASE_PATH } from "@/config/basepath";
import { type AuthContext } from "@/contexts/auth";
import { type RouterContext } from "@/libs/router";
import { routeTree } from "@/routeTree.gen";

interface CreateTestRouterOptions {
  initialLocation?: string;
  isServer?: boolean;
  routerContext?: TestRouterContext;
}

interface TestRouterContext {
  auth?: Partial<AuthContext>;
  queryClient?: QueryClient;
}

const defaultAuthContext: AuthContext = {
  isAuthenticated: false,
  logout: () => undefined,
  sessionToken: null,
  sessionTokenClaims: null,
};

export function createTestRouterFromFiles({
  initialLocation = "/",
  isServer = false,
  routerContext = {},
}: CreateTestRouterOptions = {}) {
  const context: RouterContext = {
    auth: {
      ...defaultAuthContext,
      ...routerContext.auth,
    },
    queryClient:
      routerContext.queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
  };

  return createRouter({
    basepath: APP_BASE_PATH,
    context,
    history: createMemoryHistory({
      initialEntries: [withBasePath(initialLocation)],
    }),
    isServer,
    routeTree,
  });
}

function withBasePath(location: string): string {
  if (location === APP_BASE_PATH || location.startsWith(`${APP_BASE_PATH}/`)) {
    return location;
  }

  return `${APP_BASE_PATH}${location.startsWith("/") ? location : `/${location}`}`;
}
