import { createFileRoute, redirect } from "@tanstack/react-router";

import { config } from "@/config/config";

export const Route = createFileRoute("/login/")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/home" });
    }
    window.location.assign(config.oidcSessionFlowStartUrl);
  },
});
