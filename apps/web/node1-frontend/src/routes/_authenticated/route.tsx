import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/AppLayout";
import { getAuthToken } from "@/libs/auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!getAuthToken()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
