import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/production/purposes")({
  component: RouteComponent,
});

// TODO: When production purpose detail is implemented, hide state change buttons for technical-only users
function RouteComponent() {
  return <div>Hello "/production/purposes"!</div>;
}
