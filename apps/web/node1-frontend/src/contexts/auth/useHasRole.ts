import type { UserRole } from "@knodia/common-models/auth";

import { useAuth } from "./useAuthContext";

export function useHasRole(role: UserRole): boolean {
  const { roles } = useAuth();
  return roles.includes(role);
}
