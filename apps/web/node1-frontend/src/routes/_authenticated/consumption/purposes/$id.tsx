import { type PurposeId, unsafeBrandId } from "@knodia/common-models/ids";
import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { eserviceDetailSearchSchema } from "@/features/e-service/models/search-params";
import { ConsumerPurposeDetail } from "@/features/purpose/components/ConsumerPurposeDetail/ConsumerPurposeDetail";
import { consumerPurposeDetailsQuery } from "@/features/purpose/services/queries";

export const Route = createFileRoute(
  "/_authenticated/consumption/purposes/$id",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { knodeId } }) => ({ knodeId }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: async ({
    context: { queryClient },
    deps: { knodeId },
    params: { id },
  }) =>
    await queryClient.ensureQueryData(
      consumerPurposeDetailsQuery(unsafeBrandId<PurposeId>(id), knodeId),
    ),
  validateSearch: eserviceDetailSearchSchema,
});

function RouteComponent() {
  const purpose = Route.useLoaderData();
  const { knodeId } = Route.useSearch();

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Consumption</Breadcrumb>
        <Breadcrumb href={{ to: "/consumption/purposes" }}>Purposes</Breadcrumb>
        <Breadcrumb>{purpose.name.en}</Breadcrumb>
      </Breadcrumbs>

      <ConsumerPurposeDetail knodeId={knodeId} purpose={purpose} />
    </>
  );
}
