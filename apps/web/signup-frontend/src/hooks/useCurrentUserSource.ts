import { type signupManagerApi } from "@knodia/signup-manager-client";
import { useQuery } from "@tanstack/react-query";

import { useAuthContext } from "@/contexts/auth";
import { getCurrentSignupUserQuery } from "@/services/queries";

// Non-suspense and auth-gated so the app root never suspends and no fetch runs once the token clears.
export function useCurrentUserSource():
  | signupManagerApi.CurrentSignupUser
  | undefined {
  const { isAuthenticated } = useAuthContext();
  const { data } = useQuery({
    ...getCurrentSignupUserQuery(),
    enabled: isAuthenticated,
  });

  return isAuthenticated ? data : undefined;
}
