import { Button } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { config } from "@/config/config";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const handleStartLogin = () => {
    window.location.href = config.oidcSessionFlowStartUrl;
  };

  return (
    <main>
      <h1>Hello Knodia Signup Frontend!</h1>
      <Button onPress={handleStartLogin}>Start OIDC Login session</Button>
    </main>
  );
}
