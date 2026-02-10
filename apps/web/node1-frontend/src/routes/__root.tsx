import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import { type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  Outlet,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { RouterProvider } from "react-aria-components";

import { AppLayout } from "@/layouts/AppLayout";

interface RouterContext {
  queryClient: QueryClient;
}

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
      <AppLayout>
        <Outlet />
      </AppLayout>
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
          formDevtoolsPlugin(),
        ]}
      />
    </RouterProvider>
  );
}
