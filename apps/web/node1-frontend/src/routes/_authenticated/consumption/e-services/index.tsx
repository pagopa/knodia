import { ButtonLink } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { ConsumptionEserviceList } from "@/features/e-service/components/ConsumptionEserviceList";

export const Route = createFileRoute("/_authenticated/consumption/e-services/")(
  {
    component: RouteComponent,
  },
);

function RouteComponent() {
  return (
    <>
      <PageHeader
        actions={
          <ButtonLink
            hierarchy="brand"
            href={{ to: "/consumption/e-services/search" }}
          >
            Search new E-Services
          </ButtonLink>
        }
        overline="Consumption"
        title="E-Services"
      />
      <ConsumptionEserviceList />
    </>
  );
}
