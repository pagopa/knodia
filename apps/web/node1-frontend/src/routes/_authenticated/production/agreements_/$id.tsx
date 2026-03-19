import { getProducerAgreementDetailsOptions } from "@knodia/bff-client/tanstack-query";
import { type AgreementId, unsafeBrandId } from "@knodia/common-models/ids";
import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { ProducerAgreementDetail } from "@/features/agreement/components/ProducerAgreementDetail/ProducerAgreementDetail";
import { client } from "@/libs/axios";

const agreementQuery = (agreementId: AgreementId) =>
  getProducerAgreementDetailsOptions({
    client,
    path: { agreementId },
  });

export const Route = createFileRoute(
  "/_authenticated/production/agreements_/$id",
)({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { id } }) =>
    await queryClient.ensureQueryData(
      agreementQuery(unsafeBrandId<AgreementId>(id)),
    ),
});

function RouteComponent() {
  const agreement = Route.useLoaderData();

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
