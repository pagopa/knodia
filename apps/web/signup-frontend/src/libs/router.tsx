import { type QueryClient } from "@tanstack/react-query";
import {
  createRouter,
  type NavigateOptions,
  type ToOptions,
} from "@tanstack/react-router";

import { type AuthContext } from "@/contexts/auth";
import { queryClient } from "@/libs/tanstack-query";
import { routeTree } from "@/routeTree.gen";

export interface RouterContext {
  auth: AuthContext;
  queryClient: QueryClient;
}

export const router = createRouter({
  context: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    auth: undefined!, // This will be set after we wrap the app in an AuthProvider
    queryClient,
  },
  defaultPreload: "intent",
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  // @see https://tanstack.com/router/latest/docs/framework/react/guide/preloading#preloading-with-external-libraries
  defaultPreloadStaleTime: 0,
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
