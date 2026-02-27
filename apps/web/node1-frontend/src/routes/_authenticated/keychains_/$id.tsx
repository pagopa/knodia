import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/keychains_/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_authenticated/production/keychains_/$id"!</div>;
}
