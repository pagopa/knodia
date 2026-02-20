import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/production/agreements")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/production/agreements"!</div>;
}
