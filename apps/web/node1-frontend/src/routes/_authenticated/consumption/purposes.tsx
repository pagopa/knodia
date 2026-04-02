import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/consumption/purposes")({
  component: RouteComponent,
});

// TODO: When purposes page is implemented, for Technical-only users:
// - Show different empty state description, no "Search new E-Services" button
// - Hide activate, suspend, reactivate, link/unlink buttons
function RouteComponent() {
  return <div>Hello "/consumption/purposes"!</div>;
}
