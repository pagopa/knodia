import { Breadcrumb, Breadcrumbs, Empty } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute(
  "/_authenticated/consumption/agreements_/archive",
)({
  component: RouteComponent,
});

function RouteComponent() {
  // TODO(KN-295): Implement archived agreements list when not empty
  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Consumption</Breadcrumb>
        <Breadcrumb href={{ to: "/consumption/agreements" }}>
          Agreements
        </Breadcrumb>
        <Breadcrumb>Archived</Breadcrumb>
      </Breadcrumbs>

      <PageHeader title="Archived" />

      <Empty
        description="Archived Agreements will be displayed here."
        icon={<SelectionPlusIcon />}
        title="You haven't archived any Agreement yet."
      />
    </>
  );
}
