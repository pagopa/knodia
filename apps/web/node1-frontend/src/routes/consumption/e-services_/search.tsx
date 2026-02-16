import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/consumption/e-services_/search")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Consumption</Breadcrumb>
        <Breadcrumb href={{ to: "/consumption/e-services" }}>
          E-Services
        </Breadcrumb>
        <Breadcrumb>Search New E-Services</Breadcrumb>
      </Breadcrumbs>

      <PageHeader title="Search New E-Services" />
      <p>todo: implement</p>
    </>
  );
}
