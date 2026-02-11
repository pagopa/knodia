import { Button } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/consumption/e-services")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageHeader
      actions={<Button hierarchy="brand">Search new E-Services</Button>}
      overline="Consumption"
      title="E-Services"
    />
  );
}
