import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/production/e-services/new/")({
  beforeLoad: () =>
    redirect({
      to: "/production/e-services/new/general",
    }),
});
