import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useState } from "react";

import { getExternalToken } from "@/libs/external-auth";
import {
  acceptExternalSession,
  endExternalSession,
} from "@/libs/external-session";

import { ExternalAuthContext } from "./useExternalAuth";

export function ExternalAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<null | string>(getExternalToken);

  const acceptSession = useCallback(
    (newToken: string) => {
      acceptExternalSession(queryClient, newToken);
      setToken(newToken);
    },
    [queryClient],
  );

  const endSession = useCallback(() => {
    endExternalSession(queryClient);
    setToken(null);
  }, [queryClient]);

  return (
    <ExternalAuthContext.Provider value={{ acceptSession, endSession, token }}>
      {children}
    </ExternalAuthContext.Provider>
  );
}
