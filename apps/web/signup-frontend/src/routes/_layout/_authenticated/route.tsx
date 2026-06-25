import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { LOGIN_URL } from "@/libs/auth";
import { getCurrentSignupUserQuery } from "@/services/queries";

export const Route = createFileRoute("/_layout/_authenticated")({
  beforeLoad: ({ context: { auth } }) => {
    if (!auth.isAuthenticated) throw redirect({ to: LOGIN_URL });
  },
  component: AuthenticatedLayout,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(getCurrentSignupUserQuery());
  },
});

function AuthenticatedLayout() {
  const router = useRouter();
  const { data } = useSuspenseQuery(getCurrentSignupUserQuery());
  const status = data.onboardingStatus;
  const previousStatus = useRef(status);

  // When the status changes in another tab (the user query refetches on focus),
  // re-run the route guards so beforeLoad redirects from the current page.
  useEffect(() => {
    if (previousStatus.current !== status) {
      previousStatus.current = status;
      void router.invalidate();
    }
  }, [status, router]);

  return <Outlet />;
}
