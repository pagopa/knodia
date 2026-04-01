import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { NotFound } from "@/components/NotFound";
import { sessionOrganizationQuery } from "@/features/session/services/queries";
import { AppLayout } from "@/layouts/AppLayout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(sessionOrganizationQuery());
  },
  notFoundComponent: NotFound,
});

function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
