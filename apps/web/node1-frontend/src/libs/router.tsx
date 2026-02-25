import { Empty, Loader } from "@knodia/ui-kit/ui";
import { BracketsCurlyIcon } from "@phosphor-icons/react";
import { type QueryClient } from "@tanstack/react-query";
import {
  createRouter,
  type NavigateOptions,
  type ToOptions,
} from "@tanstack/react-router";

import { APP_BASE_PATH } from "@/config/basepath";
import { queryClient } from "@/libs/tanstack-query";
import { routeTree } from "@/routeTree.gen";

export interface RouterContext {
  auth: {
    isAuthenticated: boolean | undefined;
  };
  queryClient: QueryClient;
}

export const router = createRouter({
  basepath: APP_BASE_PATH,
  context: {
    auth: {
      isAuthenticated: undefined,
    },
    queryClient,
  },
  defaultErrorComponent: () => (
    <Empty
      className="mt-10"
      description="Please try again later"
      kind="error"
      title="Something went wrong"
    />
  ),
  defaultNotFoundComponent: () => (
    <Empty
      className="mt-10"
      description="The page you're looking for doesn't exists or has been moved."
      icon={<BracketsCurlyIcon />}
      kind="neutral"
      title="Page not found"
    />
  ),
  defaultPendingComponent: () => (
    <Loader className="mx-auto mt-20" label="Loading..." />
  ),
  defaultPreload: "intent",
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  // @see https://tanstack.com/router/latest/docs/framework/react/guide/preloading#preloading-with-external-libraries
  defaultPreloadStaleTime: 0,
  routeTree,
  scrollRestoration: true,
  scrollToTopSelectors: [() => document.getElementById("main-content")],
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
