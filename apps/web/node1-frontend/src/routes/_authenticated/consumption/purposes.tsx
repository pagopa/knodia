import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/consumption/purposes")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/production/purposes"!</div>;
}
