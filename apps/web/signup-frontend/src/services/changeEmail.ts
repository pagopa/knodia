import { type QueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { z } from "zod";

import { getCurrentSignupUserQuery } from "./queries";

// signup-manager problem codes (apps/services/signup-manager/src/models/errors.ts);
// "011" is the service prefix.
const EMAIL_ALREADY_IN_USE_CODE = "011-0001";
const PENDING_EMAIL_CHANGE_CODE = "011-0004";

const ProblemBody = z.object({
  errors: z.array(z.object({ code: z.string() })).min(1),
});

export function changeEmailErrorMessage(error: AxiosError): string {
  switch (firstProblemCode(error)) {
    case EMAIL_ALREADY_IN_USE_CODE:
      return "This email address is already in use. Please choose a different one.";
    case PENDING_EMAIL_CHANGE_CODE:
      return "You already have a pending email change. Please wait for it to be applied before requesting a new one.";
    default:
      return "Something went wrong while changing your email address. Please try again.";
  }
}

function firstProblemCode(error: AxiosError): string | undefined {
  return ProblemBody.safeParse(error.response?.data).data?.errors.at(0)?.code;
}

const POLL_INTERVAL_MS = 1000;
const POLL_MAX_ATTEMPTS = 10;

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The email change is applied asynchronously by signup-updater, so the 204 only
 * acknowledges the request. Refetch getCurrentSignupUser until the new email lands
 * (updating the cache that drives the credentials banner). Returns true once it
 * lands, or false if the window elapses first.
 */
export async function pollCurrentUserUntilEmail(
  queryClient: QueryClient,
  expectedEmail: string,
  {
    intervalMs = POLL_INTERVAL_MS,
    maxAttempts = POLL_MAX_ATTEMPTS,
  }: { intervalMs?: number; maxAttempts?: number } = {},
): Promise<boolean> {
  // fetchQuery supplies the queryFn and writes the shared cache, so the banner's
  // useSuspenseQuery observer re-renders with the fresh value.
  const query = { ...getCurrentSignupUserQuery(), staleTime: 0 };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await delay(intervalMs);
    try {
      const user = await queryClient.fetchQuery(query);
      if (user.email === expectedEmail) return true;
    } catch {
      // Transient refetch failure; keep polling until the window elapses.
    }
  }
  return false;
}
