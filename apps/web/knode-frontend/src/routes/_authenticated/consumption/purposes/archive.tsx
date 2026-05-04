import { Breadcrumb, Breadcrumbs, Empty } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";

export const Route = createFileRoute(
  "/_authenticated/consumption/purposes/archive",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const canManagePurposes = useHasRole("administrative");

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Consumption</Breadcrumb>
        <Breadcrumb href={{ to: "/consumption/purposes" }}>Purposes</Breadcrumb>
        <Breadcrumb>Archive</Breadcrumb>
      </Breadcrumbs>

      <PageHeader title="Purposes" />

      <Empty
        description="Archived Purposes will be displayed here."
        icon={<SelectionPlusIcon />}
        title={
          canManagePurposes
            ? "You haven't archived any Purpose yet."
            : "There are no archived Purposes."
        }
      />
    </>
  );
}
