import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import heroCanvas from "@/assets/hero-canvas.webp";
import {
  CreatingCredentialsLoader,
  RegistrationForm,
} from "@/components/features";
import { resolveOnboardingRedirect } from "@/services/onboarding";
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
    if (resolveOnboardingRedirect(onboardingStatus) !== "/registration") {
      throw redirect({ to: "/home" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string>();

  const confirmOnboarding = useMutation({
    ...confirmOnboardingMutationOptions(),
    onError: (error) => {
      setErrorMessage(confirmOnboardingErrorMessage(error));
    },
    onSuccess: async () => {
      // refetchType "all": this page has no active observer of the query, so the
      // default would skip the refetch and /home's guard would read a stale
      // NOT_COMPLETED and bounce back here.
      await queryClient.invalidateQueries({
        queryKey: getCurrentSignupUserQuery().queryKey,
        refetchType: "all",
      });
      await navigate({ to: "/home" });
    },
  });

  return (
    <section className="relative flex min-h-[820px] flex-1 flex-col pt-(--header-height)">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img
          alt=""
          className="size-full max-w-none object-cover"
          src={heroCanvas}
        />
        <div className="absolute inset-0 bg-neutral-white/60" />
      </div>
      {confirmOnboarding.isPending ? (
        <div className="relative m-auto">
          <CreatingCredentialsLoader />
        </div>
      ) : (
        <div className="relative mx-auto w-full max-w-(--header-shell-max) px-(--header-inline-padding) pt-[109px]">
          <RegistrationForm
            errorMessage={errorMessage}
            onSubmit={(email) => {
              setErrorMessage(undefined);
              confirmOnboarding.mutate({ body: { email } });
            }}
          />
        </div>
      )}
    </section>
  );
}
