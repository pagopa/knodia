import type { UserRole } from "@knodia/common-models/auth";
import type { ReactElement, ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthContext } from "@/contexts/auth";

interface RouteConfig {
  component?: () => ReactNode;
  path: string;
}

interface WrapperOptions {
  initialPath?: string | undefined;
  queryClient?: QueryClient | undefined;
  roles?: readonly UserRole[] | undefined;
  routes?: RouteConfig[] | undefined;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & WrapperOptions,
) {
  const { initialPath, queryClient, roles, ...renderOptions } = options ?? {};
  const {
    queryClient: testQueryClient,
    router,
    TestWrapper,
  } = createTestWrapper({ initialPath, queryClient, roles });

  const user = userEvent.setup();

  return {
    ...render(ui, { wrapper: TestWrapper, ...renderOptions }),
    queryClient: testQueryClient,
    router,
    user,
  };
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false, throwOnError: false },
      queries: { gcTime: 0, retry: false, throwOnError: false },
    },
  });
}

function createTestWrapper(options: WrapperOptions = {}) {
  const {
    initialPath = "/",
    queryClient = createTestQueryClient(),
    roles = ["administrative", "technical"] as const,
    routes = [],
  } = options;

  const rootRoute = createRootRoute({
    component: ({ children }: { children?: ReactNode }) => <>{children}</>,
  });

  const indexRoute = createRoute({
    component: () => null,
    getParentRoute: () => rootRoute,
    path: "/",
  });

  const extraRoutes = routes.map((r) =>
    createRoute({
      component: r.component ?? (() => null),
      getParentRoute: () => rootRoute,
      path: r.path,
    }),
  );

  const router = createRouter({
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    routeTree: rootRoute.addChildren([indexRoute, ...extraRoutes]),
  });

  function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            isAuthenticated: true,
            isLoading: false,
            login: () => undefined,
            logout: () => Promise.resolve(),
            roles,
            token: "test-token",
            username: "test-user",
          }}
        >
          <RouterContextProvider router={router}>
            {children}
          </RouterContextProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return { queryClient, router, TestWrapper };
}

export { screen, waitFor } from "@testing-library/react";
