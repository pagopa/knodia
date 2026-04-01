import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { NotFound } from "@/components/NotFound";
import { AppLayout } from "@/layouts/AppLayout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
  notFoundComponent: NotFound,
});

function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
