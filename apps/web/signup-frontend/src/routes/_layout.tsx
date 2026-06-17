import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PageLayout } from "@/components/layout";

export const Route = createFileRoute("/_layout")({
  component: () => (
    <PageLayout>
      <Outlet />
    </PageLayout>
  ),
});
