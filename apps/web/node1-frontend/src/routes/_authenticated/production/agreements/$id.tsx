import { type AgreementId, unsafeBrandId } from "@knodia/common-models/ids";
import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ProducerAgreementDetail } from "@/features/agreement/components/ProducerAgreementDetail/ProducerAgreementDetail";
import { producerAgreementDetailsQuery } from "@/features/agreement/services/queries";

export const Route = createFileRoute(
  "/_authenticated/production/agreements/$id",
)({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { id } }) =>
    await queryClient.ensureQueryData(
      producerAgreementDetailsQuery(unsafeBrandId<AgreementId>(id)),
    ),
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: agreement } = useSuspenseQuery(
    producerAgreementDetailsQuery(unsafeBrandId<AgreementId>(id)),
  );

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Production</Breadcrumb>
        <Breadcrumb href={{ to: "/production/agreements" }}>
          Agreements
        </Breadcrumb>
        <Breadcrumb>Agreement request</Breadcrumb>
      </Breadcrumbs>

      <ProducerAgreementDetail agreement={agreement} />
    </>
  );
}
