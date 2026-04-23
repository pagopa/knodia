import { type PurposeId, unsafeBrandId } from "@knodia/common-models/ids";
import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { ProducerPurposeDetail } from "@/features/purpose/components/ProducerPurposeDetail/ProducerPurposeDetail";
import { producerPurposeDetailsQuery } from "@/features/purpose/services/queries";

export const Route = createFileRoute("/_authenticated/production/purposes/$id")(
  {
    component: RouteComponent,
    loader: async ({ context: { queryClient }, params: { id } }) =>
      await queryClient.ensureQueryData(
        producerPurposeDetailsQuery(unsafeBrandId<PurposeId>(id)),
      ),
  },
);

function RouteComponent() {
  const purpose = Route.useLoaderData();

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Production</Breadcrumb>
        <Breadcrumb href={{ to: "/production/purposes" }}>Purposes</Breadcrumb>
        <Breadcrumb>{purpose.name.en}</Breadcrumb>
      </Breadcrumbs>

      <ProducerPurposeDetail purpose={purpose} />
    </>
  );
}
