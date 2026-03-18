import { Button, Empty } from "@knodia/ui-kit/ui";
import { ArchiveIcon, SelectionPlusIcon } from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/consumption/agreements")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        actions={
          <Button
            hierarchy="neutral"
            kind="ghost"
            onPress={() => navigate({ to: "/consumption/agreements/archive" })}
          >
            <ArchiveIcon />
            Archive
          </Button>
        }
        overline="Consumption"
        title="Agreements"
      />

      <Empty
        action={{
          as: "button",
          hierarchy: "brand",
          kind: "filled",
          label: "Search new E-Services",
          onClick: () => navigate({ to: "/consumption/e-services/search" }),
        }}
        description="Search for an E-Service to request an Agreement."
        icon={<SelectionPlusIcon />}
        title="You don't have any Agreements yet."
      />
    </div>
  );
}
