import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getStoredSessionToken } from "@/libs/auth";
import { getCurrentSignupUserQuery } from "@/services/queries";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated && !getStoredSessionToken()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(getCurrentSignupUserQuery());
  },
});

function AuthenticatedLayout() {
  return <Outlet />;
}
