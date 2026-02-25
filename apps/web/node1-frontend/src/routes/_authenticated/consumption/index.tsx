import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/consumption/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/consumption/"!</div>;
}
