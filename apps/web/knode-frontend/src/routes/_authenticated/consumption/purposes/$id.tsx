import { type PurposeId, unsafeBrandId } from "@knodia/common-models/ids";
import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ConsumerPurposeDetail } from "@/features/purpose/components/ConsumerPurposeDetail/ConsumerPurposeDetail";
import { purposeDetailSearchSchema } from "@/features/purpose/models/search-params";
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
  validateSearch: purposeDetailSearchSchema,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { knodeId } = Route.useSearch();
  const { data: purpose } = useSuspenseQuery(
    consumerPurposeDetailsQuery(unsafeBrandId<PurposeId>(id), knodeId),
  );

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
