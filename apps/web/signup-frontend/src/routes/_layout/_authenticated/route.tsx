import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { LOGIN_URL } from "@/libs/auth";
import { getCurrentSignupUserQuery } from "@/services/queries";

export const Route = createFileRoute("/_layout/_authenticated")({
  beforeLoad: ({ context: { auth } }) => {
    if (!auth.isAuthenticated) throw redirect({ to: LOGIN_URL });
  },
  component: Outlet,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(getCurrentSignupUserQuery());
  },
});
