import { useSuspenseQuery } from "@tanstack/react-query";

import { useAuthContext } from "@/contexts/auth";
import { getCurrentSignupUserQuery } from "@/services/queries";

export function useCurrentUser() {
  const { sessionTokenClaims } = useAuthContext();
  const { data } = useSuspenseQuery(getCurrentSignupUserQuery());

  if (!sessionTokenClaims || !data) {
    return null;
  }

  return { ...sessionTokenClaims, ...data };
}
