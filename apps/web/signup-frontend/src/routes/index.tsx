import { createFileRoute } from "@tanstack/react-router";
import { Button } from "react-aria-components";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const handleStartLogin = () => {
    window.location.href = "https://localhost:4200/auth/oidc/start";
  };

  return (
    <main>
      <h1>Hello Knodia Signup Frontend!</h1>
      <Button onPress={handleStartLogin}>Start OIDC Login session</Button>
    </main>
  );
}
