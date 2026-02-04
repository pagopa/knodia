import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  type NavigateOptions,
  RouterProvider,
  type ToOptions,
} from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { queryClient } from "@/libs/tanstack-query";
import { routeTree } from "@/routeTree.gen";

import "@knodia/ui-kit/themes/node1.css";

const router = createRouter({
  context: {
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

const rootElement = document.getElementById("root");

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
