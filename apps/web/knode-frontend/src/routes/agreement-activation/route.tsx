import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ExternalAuthProvider } from "@/contexts/external-auth/ExternalAuthContext";

export const Route = createFileRoute("/agreement-activation")({
  component: ExternalLayoutRoute,
});

function ExternalLayoutRoute() {
  return (
    <ExternalAuthProvider>
      <Outlet />
    </ExternalAuthProvider>
  );
}
