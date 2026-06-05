import { createFileRoute, Outlet } from "@tanstack/react-router";

import { redirectToLogin } from "@/libs/auth";
import { getCurrentSignupUserQuery } from "@/services/queries";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context: { auth } }) => {
    if (!auth.isAuthenticated) redirectToLogin();
  },
  component: Outlet,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(getCurrentSignupUserQuery());
  },
});
