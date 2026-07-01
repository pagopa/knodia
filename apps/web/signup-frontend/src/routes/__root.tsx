import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { RouterProvider } from "react-aria-components";

import { type RouterContext } from "@/libs/router";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  const router = useRouter();
  return (
    <RouterProvider
      navigate={(href, opts) => {
        if (typeof href === "string") return;
        router.navigate({ ...href, ...opts });
      }}
      useHref={(href) => {
        if (typeof href === "string") return href;
        return router.buildLocation(href).href;
      }}
    >
      <HeadContent />
      <Outlet />
      <TanStackDevtools
        plugins={[
          {
            name: "TanStack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </RouterProvider>
  );
}
