import { useSuspenseQuery } from "@tanstack/react-query";

import { useAuth } from "@/libs/auth";
import { getCurrentSignupUserQuery } from "@/services/queries";

export function useCurrentUser() {
  const { sessionTokenClaims } = useAuth();
  const { data } = useSuspenseQuery(getCurrentSignupUserQuery());

  if (!sessionTokenClaims || !data) {
    return null;
  }

  return { ...sessionTokenClaims, ...data };
}
