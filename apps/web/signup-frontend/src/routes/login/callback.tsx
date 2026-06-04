import { signupManagerApi } from "@knodia/signup-manager-client";
import { Loader } from "@knodia/ui-kit/ui";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { client } from "@/libs/axios";

export const Route = createFileRoute("/login/callback")({
  loaderDeps: ({ search }) => ({
    code: search.code,
    state: search.state,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: async ({ deps, context: { auth } }) => {
    const response = await signupManagerApi.exchangeOidcCode({
      client,
      query: {
        code: deps.code,
        state: deps.state,
      },
      withCredentials: true,
    });

    auth.setSessionToken(response.data.uiSignupSessionToken);
    throw redirect({ replace: true, to: "/home" });
  },
  onError: () => {
    throw redirect({ to: "/login" });
  },
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <Loader label="Signing in..." />
    </div>
  ),
  validateSearch: z.object({
    code: z.string(),
    state: z.string(),
  }),
});
