import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute(
  "/_authenticated/consumption/agreements_/archive",
)({
  component: RouteComponent,
});

function RouteComponent() {
  // TODO: Implement archived agreements list
  return <PageHeader title="Archived" />;
}
