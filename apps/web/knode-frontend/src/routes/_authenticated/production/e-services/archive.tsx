import { Breadcrumb, Breadcrumbs, Empty } from "@knodia/ui-kit/ui";
import { ArchiveIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { ProductionEserviceList } from "@/features/e-service/components/ProductionEserviceList";
import { archivedProducerEservicesQuery } from "@/features/e-service/services/queries";

const archivedEserviceSearchDefaultValues = { offset: 0 };

const archivedEserviceSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(archivedEserviceSearchDefaultValues.offset)
    .catch(archivedEserviceSearchDefaultValues.offset),
});

export const Route = createFileRoute(
  "/_authenticated/production/e-services/archive",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(archivedProducerEservicesQuery(offset));
  },
  search: {
    middlewares: [stripSearchParams(archivedEserviceSearchDefaultValues)],
  },
  validateSearch: archivedEserviceSearchSchema,
});

function RouteComponent() {
  const { offset } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...archivedProducerEservicesQuery(offset),
    placeholderData: keepPreviousData,
  });

  return (
    <ListPageLayout
      pagination={{
        limit: data?.pagination.limit ?? 0,
        offset,
        onOffsetChange: (offset) => navigate({ search: { offset } }),
        totalItems: data?.pagination.total ?? 0,
      }}
    >
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Production</Breadcrumb>
        <Breadcrumb href={{ to: "/production/e-services" }}>
          E-Services
        </Breadcrumb>
        <Breadcrumb>Archive</Breadcrumb>
      </Breadcrumbs>

      <PageHeader title="Archive" />

      {!isLoading && data?.results.length === 0 ? (
        <Empty
          description="E-Services you archive will appear here."
          icon={<ArchiveIcon />}
          title="No archived E-Services yet."
        />
      ) : (
        <ProductionEserviceList
          eservices={data?.results ?? []}
          isLoading={isLoading}
        />
      )}
    </ListPageLayout>
  );
}
