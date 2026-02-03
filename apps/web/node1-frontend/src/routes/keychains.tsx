import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/keychains")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/keychains"!</div>;
}
