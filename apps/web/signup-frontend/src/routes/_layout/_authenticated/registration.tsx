import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import heroCanvas from "@/assets/hero-canvas.webp";
import {
  CreatingCredentialsLoader,
  RegistrationForm,
} from "@/components/features";
import { useOnboardingPublishRecovery } from "@/hooks/useOnboardingPublishRecovery";
import {
  isOnboardingPending,
  keepsUserOnRegistration,
  resolveOnboardingRedirect,
  signupUserEmail,
} from "@/services/onboarding";
import {
  confirmOnboardingMutationOptions,
  getCurrentSignupUserQuery,
} from "@/services/queries";
import { confirmOnboardingErrorMessage } from "@/services/registration";

export const Route = createFileRoute("/_layout/_authenticated/registration")({
  beforeLoad: async ({ context: { queryClient } }) => {
    const { onboardingStatus } = await queryClient.ensureQueryData(
      getCurrentSignupUserQuery(),
    );
    const destination = resolveOnboardingRedirect(onboardingStatus);
    if (destination !== "/registration") {
      throw redirect({ to: destination });
    }
  },
  component: RouteComponent,
});

const ONBOARDING_PENDING_POLL_MS = 3000;

function RouteComponent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string>();

  const { data } = useSuspenseQuery({
    ...getCurrentSignupUserQuery(),
    refetchInterval: (query) =>
      query.state.data && isOnboardingPending(query.state.data.onboardingStatus)
        ? ONBOARDING_PENDING_POLL_MS
        : false,
  });
  const { onboardingStatus } = data;
  const email = signupUserEmail(data);

  // On a leave status, re-run the route guard instead of re-deriving the
  // destination here (the resolver could throw).
  useEffect(() => {
    if (!keepsUserOnRegistration(onboardingStatus)) {
      void router.invalidate();
    }
  }, [onboardingStatus, router]);

  const confirmOnboarding = useMutation({
    ...confirmOnboardingMutationOptions(),
    onError: (error) => {
      setErrorMessage(confirmOnboardingErrorMessage(error));
    },
    onSuccess: async () => {
      // Refetch the now-pending status; the poller drives the redirect.
      await queryClient.invalidateQueries({
        queryKey: getCurrentSignupUserQuery().queryKey,
      });
    },
  });

  const { mutate: confirmMutate } = confirmOnboarding;
  const republish = useCallback(
    (recoveryEmail: string) => {
      confirmMutate({ body: { email: recoveryEmail } });
    },
    [confirmMutate],
  );

  useOnboardingPublishRecovery({
    email,
    // Only the load-already-pending case (no manual submit) recovers.
    enabled: confirmOnboarding.isIdle,
    onboardingStatus,
    republish,
  });

  return (
    <section className="relative flex min-h-[916px] flex-1 flex-col pt-(--header-height)">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img
          alt=""
          className="size-full max-w-none object-cover"
          src={heroCanvas}
        />
        <div className="absolute inset-0 bg-neutral-white/60" />
      </div>
      {/* Toggle visibility instead of unmounting the form: a recoverable error
          (e.g. email already in use) must not wipe the entered email + consents. */}
      <div
        className={
          confirmOnboarding.isPending || isOnboardingPending(onboardingStatus)
            ? "relative m-auto"
            : "hidden"
        }
      >
        <CreatingCredentialsLoader />
      </div>
      <div
        className={
          confirmOnboarding.isPending || isOnboardingPending(onboardingStatus)
            ? "hidden"
            : "relative mx-auto w-full max-w-(--header-shell-max) px-(--header-inline-padding) pt-[109px]"
        }
      >
        <RegistrationForm
          errorMessage={errorMessage}
          onSubmit={(email) => {
            setErrorMessage(undefined);
            confirmOnboarding.mutate({ body: { email } });
          }}
        />
      </div>
    </section>
  );
}
