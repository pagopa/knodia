import { getProducerAgreementsOptions } from "@knodia/bff-client/tanstack-query";
import { Pagination } from "@knodia/ui-kit/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { ProducerAgreementTable } from "@/features/agreement/components/ProducerAgreementTable/ProducerAgreementTable";
import {
  producerAgreementSearchDefaultValues,
  producerAgreementSearchSchema,
} from "@/features/agreement/models/search-params";
import { client } from "@/libs/axios";

const AGREEMENTS_PAGE_LIMIT = 9;

const agreementsQuery = (offset: number) =>
  getProducerAgreementsOptions({
    client,
    query: { limit: AGREEMENTS_PAGE_LIMIT, offset },
  });

export const Route = createFileRoute("/_authenticated/production/agreements/")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(agreementsQuery(offset));
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
    ...agreementsQuery(offset),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader overline="Production" title="Agreements" />

      <ProducerAgreementTable
        agreements={data?.items ?? []}
        isLoading={isLoading}
      />

      <Pagination
        className="mx-auto mt-auto pt-6"
        limit={data?.pagination.limit ?? 0}
        offset={offset}
        onOffsetChange={(offset) =>
          navigate({ replace: true, search: (s) => ({ ...s, offset }) })
        }
        totalItems={data?.pagination.total ?? 0}
      />
    </div>
  );
}
