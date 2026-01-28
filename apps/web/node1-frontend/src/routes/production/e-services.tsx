import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/production/e-services")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/production/e-services"!</div>;
}
