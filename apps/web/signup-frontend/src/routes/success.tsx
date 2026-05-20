import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/success")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Identificazione con One Identity avvenuta con successo!</div>;
}
