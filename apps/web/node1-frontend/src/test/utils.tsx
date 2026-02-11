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

interface RouteConfig {
  component?: () => ReactNode;
  path: string;
}

interface WrapperOptions {
  initialPath?: string | undefined;
  queryClient?: QueryClient | undefined;
  routes?: RouteConfig[] | undefined;
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false, throwOnError: false },
      queries: { gcTime: 0, retry: false, throwOnError: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & WrapperOptions,
) {
  const { initialPath, queryClient, ...renderOptions } = options ?? {};
  const {
    queryClient: testQueryClient,
    router,
    TestWrapper,
  } = createTestWrapper({ initialPath, queryClient });

  const user = userEvent.setup();

  return {
    ...render(ui, { wrapper: TestWrapper, ...renderOptions }),
    queryClient: testQueryClient,
    router,
    user,
  };
}

function createTestWrapper(options: WrapperOptions = {}) {
  const {
    initialPath = "/",
    queryClient = createTestQueryClient(),
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
        <RouterContextProvider router={router}>
          {children}
        </RouterContextProvider>
      </QueryClientProvider>
    );
  }

  return { queryClient, router, TestWrapper };
}

export { screen, waitFor, within } from "@testing-library/react";
