import { createFileRoute, redirect } from "@tanstack/react-router";

import { Button } from "@/components/ui";
import { config } from "@/config/config";
import { resolveOnboardingRedirect } from "@/services/onboarding";
import { getCurrentSignupUserQuery } from "@/services/queries";

export const Route = createFileRoute("/_layout/_authenticated/suspended")({
  beforeLoad: async ({ context: { queryClient } }) => {
    const { onboardingStatus } = await queryClient.ensureQueryData(
      getCurrentSignupUserQuery(),
    );
    if (resolveOnboardingRedirect(onboardingStatus) !== "/suspended") {
      throw redirect({ to: "/home" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex min-h-[756px] flex-1 flex-col items-center justify-center bg-[linear-gradient(to_bottom,var(--color-primary-violet-surface)_70%,var(--color-neutral-white))] px-(--header-inline-padding) pt-(--header-height) text-center">
      <div className="flex max-w-[800px] flex-col items-center gap-8">
        <div className="flex flex-col gap-6">
          <h1 className="text-style-section-title text-neutral-graphite">
            You requested the restriction of processing
          </h1>
          <p className="text-style-subheading text-neutral-graphite">
            Your access to the prototype is suspended while your request is
            being reviewed.
          </p>
        </div>
        <Button
          onPress={() => {
            window.location.href = config.knodiaOrgUrl;
          }}
        >
          Go to the homepage
        </Button>
      </div>
    </section>
  );
}
