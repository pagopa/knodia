import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { ConsumerAgreementsSummary } from "@/features/agreement/components/ConsumerAgreementsSummary";

export const Route = createFileRoute("/_authenticated/consumption/agreements")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader overline="Consumption" title="Agreements" />

      <ConsumerAgreementsSummary />
    </div>
  );
}
