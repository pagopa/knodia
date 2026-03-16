import { Empty } from "@knodia/ui-kit/ui";
import { SelectionIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/production/agreements")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader overline="Production" title="Agreements" />

      <Empty
        description="Agreements requested for your E-Services by Consumer Organizations will appear here."
        icon={<SelectionIcon />}
        title="There are no Agreements for your E-Services."
      />
    </>
  );
}
