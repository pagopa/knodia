import { createFileRoute } from "@tanstack/react-router";

import { useCurrentUser } from "@/hooks/useCurrentUser";

export const Route = createFileRoute("/_authenticated/home")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useCurrentUser();
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <h2>User data:</h2>
      <code>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </code>
    </div>
  );
}
