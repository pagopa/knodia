import type { UserRole } from "@knodia/common-models/auth";

import { generateUserId } from "@knodia/common-models/ids";
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
import { type ReactElement, type ReactNode, Suspense } from "react";
import { I18nProvider } from "react-aria-components";

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
    context: { auth: { isAuthenticated: true, roles }, queryClient },
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    routeTree: rootRoute.addChildren([indexRoute, ...extraRoutes]),
  });

  function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <I18nProvider locale="en-GB">
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider
            value={{
              isAuthenticated: true,
              isLoading: false,
              login: () => undefined,
              logout: () => Promise.resolve(),
              roles,
              token: "test-token",
              userId: generateUserId(),
              username: "test-user",
            }}
          >
            <RouterContextProvider router={router}>
              <Suspense fallback={null}>{children}</Suspense>
            </RouterContextProvider>
          </AuthContext.Provider>
        </QueryClientProvider>
      </I18nProvider>
    );
  }

  return { queryClient, router, TestWrapper };
}

export { screen, waitFor } from "@testing-library/react";
