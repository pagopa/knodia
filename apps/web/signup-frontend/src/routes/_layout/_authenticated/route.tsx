import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { LOGIN_ROUTE } from "@/libs/auth";
import { getCurrentSignupUserQuery } from "@/services/queries";

export const Route = createFileRoute("/_layout/_authenticated")({
  beforeLoad: ({ context: { auth } }) => {
    if (!auth.isAuthenticated) throw redirect({ to: LOGIN_ROUTE });
  },
  component: AuthenticatedLayout,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(getCurrentSignupUserQuery());
  },
});

function AuthenticatedLayout() {
  const router = useRouter();
  const { data } = useSuspenseQuery(getCurrentSignupUserQuery());
  // Route context is a match-time snapshot, so re-run the guards on any user change to refresh it.
  const key =
    data.onboardingStatus === "NOT_COMPLETED"
      ? data.onboardingStatus
      : `${data.onboardingStatus}|${data.email}`;
  const previousKey = useRef(key);

  useEffect(() => {
    if (previousKey.current !== key) {
      previousKey.current = key;
      void router.invalidate();
    }
  }, [key, router]);

  return <Outlet />;
}
