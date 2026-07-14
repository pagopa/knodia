import { type QueryClient } from "@tanstack/react-query";
import {
  createRouter,
  type NavigateOptions,
  type ToOptions,
} from "@tanstack/react-router";

import { ErrorPage } from "@/components/layout/ErrorPage";
import { APP_BASE_PATH } from "@/config/basepath";
import { type AuthContext } from "@/contexts/auth";
import { queryClient } from "@/libs/tanstack-query";
import { routeTree } from "@/routeTree.gen";

export interface RouterContext {
  auth: AuthContext;
  queryClient: QueryClient;
}

// Behavioural options the test router (file-route-utils.tsx) must mirror so
// route-level tests exercise the same error UI and routing behaviour as prod.
// scrollRestoration stays out: it's browser-only and irrelevant in jsdom.
export const sharedRouterOptions = {
  defaultErrorComponent: ErrorPage,
  defaultPreload: "intent",
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  // @see https://tanstack.com/router/latest/docs/framework/react/guide/preloading#preloading-with-external-libraries
  defaultPreloadStaleTime: 0,
  notFoundMode: "root",
} as const;

export const router = createRouter({
  ...sharedRouterOptions,
  basepath: APP_BASE_PATH,
  context: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    auth: undefined!, // This will be set after we wrap the app in an AuthProvider
    queryClient,
  },
  routeTree,
  scrollRestoration: true,
});

/**
 * Register the router instance to enable type-safe hooks and utilities.
 * This allows TypeScript to infer the correct types for useNavigate, useParams, useSearch, etc.
 * @see https://tanstack.com/router/latest/docs/framework/react/guide/type-safety#exported-hooks-components-and-utilities
 */
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/**
 * Configure the type of the `href` and `routerOptions` props on all React Aria components.
 * @see https://react-aria.adobe.com/frameworks
 */
declare module "react-aria-components" {
  interface RouterConfig {
    href: ToOptions;
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  }
}
