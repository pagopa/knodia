import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/success")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Successfully authenticated on One Identity!</div>;
}
