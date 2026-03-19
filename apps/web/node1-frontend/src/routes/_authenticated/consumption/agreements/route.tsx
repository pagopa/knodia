import { getConsumerAgreementsOptions } from "@knodia/bff-client/tanstack-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { ConsumerAgreementsSummary } from "@/features/agreement/components/ConsumerAgreementsSummary";
import { client } from "@/libs/axios";

export const Route = createFileRoute("/_authenticated/consumption/agreements")({
  component: RouteComponent,
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(getConsumerAgreementsOptions({ client })),
});

function RouteComponent() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader overline="Consumption" title="Agreements" />

      <ConsumerAgreementsSummary />
    </div>
  );
}
