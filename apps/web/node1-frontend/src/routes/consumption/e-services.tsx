import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/consumption/e-services")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/production/e-services"!</div>;
}
