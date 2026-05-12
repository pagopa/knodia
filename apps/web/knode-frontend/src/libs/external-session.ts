import type { QueryClient } from "@tanstack/react-query";

import { getAgreementActivationDetailsQueryKey } from "@knodia/bff-client/tanstack-query";

import { clearExternalToken, setExternalToken } from "@/libs/external-auth";
import { externalClient } from "@/libs/external-axios";

export function acceptExternalSession(
  queryClient: QueryClient,
  token: string,
): void {
  clearExternalCache(queryClient);
  setExternalToken(token);
}

export function endExternalSession(queryClient: QueryClient): void {
  clearExternalToken();
  clearExternalCache(queryClient);
}

// Cache keys have no session discriminator, so clear when the token rotates
// to stop a new session from reading a previous one's response.
function clearExternalCache(queryClient: QueryClient): void {
  void queryClient.removeQueries({
    queryKey: getAgreementActivationDetailsQueryKey({ client: externalClient }),
  });
}
