import { signupManagerApi } from "@knodia/signup-manager-client";
import { Loader } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const callbackSearchSchema = z.object({
  code: z.string(),
  state: z.string(),
});

export const Route = createFileRoute("/login/callback")({
  component: CallbackPage,
  loaderDeps: ({ search }) => ({
    code: search.code,
    state: search.state,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: async ({ deps }) => {
    const data = await signupManagerApi.exchangeOidcCode({
      query: {
        code: deps.code,
        state: deps.state,
      },
    });

    console.log(data);
  },
  validateSearch: callbackSearchSchema,
});

function CallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader label="Signing in..." />
    </div>
  );
}
