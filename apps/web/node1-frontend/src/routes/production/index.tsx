import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/production/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/production/"!</div>;
}
