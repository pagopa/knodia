import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useSyncExternalStore } from "react";

import {
  getExternalToken,
  subscribeToExternalToken,
} from "@/libs/external-auth";
import {
  acceptExternalSession,
  endExternalSession,
} from "@/libs/external-session";

import { ExternalAuthContext } from "./useExternalAuth";

export function ExternalAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Storage is the single source of truth; we subscribe so writes made
  // outside React (e.g., router beforeLoad) propagate without an extra effect.
  const token = useSyncExternalStore(
    subscribeToExternalToken,
    getExternalToken,
    () => null,
  );

  const acceptSession = useCallback(
    (newToken: string) => {
      acceptExternalSession(queryClient, newToken);
    },
    [queryClient],
  );

  const endSession = useCallback(() => {
    endExternalSession(queryClient);
  }, [queryClient]);

  return (
    <ExternalAuthContext.Provider value={{ acceptSession, endSession, token }}>
      {children}
    </ExternalAuthContext.Provider>
  );
}
