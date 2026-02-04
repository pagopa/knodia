import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/operators")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/operators"!</div>;
}
