import { Loader } from "@knodia/ui-kit/ui";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const callbackSearchSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
});

export const Route = createFileRoute("/callback/")({
  beforeLoad: ({ search }) => {
    if (!search.code) {
      throw redirect({ to: "/login" });
    }
  },
  component: CallbackPage,
  validateSearch: callbackSearchSchema,
});

function CallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader label="Signing in..." />
    </div>
  );
}
