import { type QueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { z } from "zod";

import { GENERIC_ERROR_MESSAGE } from "./messages";
import { getCurrentSignupUserQuery } from "./queries";

// signup-manager problem codes (see its models/errors.ts).
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
      return GENERIC_ERROR_MESSAGE;
  }
}

// Email-in-use is the only field-level error: it stays inline on the input, every
// other failure surfaces in the modal banner.
export function isEmailAlreadyInUseError(error: AxiosError): boolean {
  return firstProblemCode(error) === EMAIL_ALREADY_IN_USE_CODE;
}

function firstProblemCode(error: AxiosError): string | undefined {
  return ProblemBody.safeParse(error.response?.data).data?.errors.at(0)?.code;
}

const POLL_INTERVAL_MS = 1000;
const POLL_MAX_ATTEMPTS = 30;

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// The change is applied asynchronously, so poll getCurrentSignupUser until the new
// email lands (updating the cache behind the banner) or the window elapses.
export async function pollCurrentUserUntilEmail(
  queryClient: QueryClient,
  expectedEmail: string,
  {
    intervalMs = POLL_INTERVAL_MS,
    maxAttempts = POLL_MAX_ATTEMPTS,
    signal,
  }: { intervalMs?: number; maxAttempts?: number; signal?: AbortSignal } = {},
): Promise<boolean> {
  const query = { ...getCurrentSignupUserQuery(), staleTime: 0 };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await delay(intervalMs);
    if (signal?.aborted) return false;
    try {
      const user = await queryClient.fetchQuery(query);
      if (user.email === expectedEmail) return true;
    } catch {
      // Transient refetch failure; keep polling until the window elapses.
    }
  }
  return false;
}
