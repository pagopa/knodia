import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { type OnboardingDestination } from "@/services/onboarding";
import { getCurrentSignupUserQuery } from "@/services/queries";

// Refresh the current user, then route to the destination the new status implies.
// refetchType "all": the calling page may have no active observer of the query, so
// the default would skip the refetch and the destination guard would read a stale status.
export function useNavigateAfterSignupChange() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async (to: OnboardingDestination) => {
    await queryClient.invalidateQueries({
      queryKey: getCurrentSignupUserQuery().queryKey,
      refetchType: "all",
    });
    await navigate({ to });
  };
}
