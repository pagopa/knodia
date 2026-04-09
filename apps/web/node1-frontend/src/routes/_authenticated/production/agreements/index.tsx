import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { ProducerAgreementTable } from "@/features/agreement/components/ProducerAgreementTable/ProducerAgreementTable";
import {
  producerAgreementSearchDefaultValues,
  producerAgreementSearchSchema,
} from "@/features/agreement/models/search-params";
import { producerAgreementsQuery } from "@/features/agreement/services/queries";

export const Route = createFileRoute("/_authenticated/production/agreements/")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(producerAgreementsQuery(offset));
  },
  search: {
    middlewares: [stripSearchParams(producerAgreementSearchDefaultValues)],
  },
  validateSearch: producerAgreementSearchSchema,
});

function RouteComponent() {
  const { offset } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...producerAgreementsQuery(offset),
    placeholderData: keepPreviousData,
  });

  return (
    <ListPageLayout
      pagination={{
        limit: data?.pagination.limit ?? 0,
        offset,
        onOffsetChange: (offset) =>
          navigate({ replace: true, search: (s) => ({ ...s, offset }) }),
        totalItems: data?.pagination.total ?? 0,
      }}
    >
      <PageHeader overline="Production" title="Agreements" />

      <ProducerAgreementTable
        agreements={data?.results ?? []}
        isLoading={isLoading}
      />
    </ListPageLayout>
  );
}
