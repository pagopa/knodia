import { useEffect, useRef } from "react";

import {
  isOnboardingPending,
  type OnboardingStatus,
} from "@/services/onboarding";

/**
 * If OnboardingCompletedV1 fails to publish after the ONBOARDING_PENDING row is
 * inserted, the row is stranded with no event and signup-updater never provisions
 * it; the page just polls /user/me, so the user is stuck on the loader forever.
 *
 * Landing already in ONBOARDING_PENDING re-issues the confirm once to (re)publish
 * the event. Re-emitting for a user already provisioning is harmless (the consumer
 * is idempotent). Gated on `enabled` so it never double-fires right after submit.
 */
export function useOnboardingPublishRecovery({
  email,
  enabled,
  onboardingStatus,
  republish,
}: {
  email: string | undefined;
  enabled: boolean;
  onboardingStatus: OnboardingStatus;
  republish: (email: string) => void;
}): void {
  const attempted = useRef(false);

  useEffect(() => {
    if (
      !attempted.current &&
      enabled &&
      email !== undefined &&
      isOnboardingPending(onboardingStatus)
    ) {
      attempted.current = true;
      republish(email);
    }
  }, [enabled, email, onboardingStatus, republish]);
}
