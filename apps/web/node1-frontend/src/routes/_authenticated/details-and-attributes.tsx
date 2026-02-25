import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/details-and-attributes")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/details-and-attributes"!</div>;
}
