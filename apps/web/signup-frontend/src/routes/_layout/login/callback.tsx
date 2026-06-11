import { signupManagerApi } from "@knodia/signup-manager-client";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { Loader } from "@/components/ui";
import { setAuthToken } from "@/libs/auth";
import { client } from "@/libs/axios";

export const Route = createFileRoute("/_layout/login/callback")({
  loaderDeps: ({ search }) => ({
    code: search.code,
    state: search.state,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: async ({ deps }) => {
    const response = await signupManagerApi.exchangeOidcCode({
      client,
      query: {
        code: deps.code,
        state: deps.state,
      },
      withCredentials: true,
    });

    setAuthToken(response.data.uiSignupSessionToken);
    throw redirect({ replace: true, to: "/home" });
  },
  onError: () => {
    throw redirect({ to: "/login" });
  },
  pendingComponent: () => (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loader label="Signing in..." />
    </div>
  ),
  validateSearch: z.object({
    code: z.string(),
    state: z.string(),
  }),
});
