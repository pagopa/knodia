import { ArchiveIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { producerEserviceOptionsQuery } from "@/features/e-service/services/queries";
import { ProducerPurposeSection } from "@/features/purpose/components/ProducerPurposeSection";
import {
  producerPurposeSearchDefaultValues,
  producerPurposeSearchSchema,
} from "@/features/purpose/models/search-params";
import { producerPurposesQuery } from "@/features/purpose/services/queries";

export const Route = createFileRoute("/_authenticated/production/purposes/")({
  component: RouteComponent,
  loaderDeps: ({ search: { eserviceId, offset } }) => ({ eserviceId, offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { eserviceId, offset } }) => {
    queryClient.prefetchQuery(producerPurposesQuery(offset, eserviceId));
    queryClient.prefetchQuery(producerEserviceOptionsQuery());
  },
  search: {
    middlewares: [stripSearchParams(producerPurposeSearchDefaultValues)],
  },
  validateSearch: producerPurposeSearchSchema,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...producerPurposesQuery(search.offset, search.eserviceId),
    placeholderData: keepPreviousData,
  });

  function handleSearchChange(values: Partial<typeof search>) {
    navigate({ replace: true, search: (s) => ({ ...s, ...values }) });
  }

  return (
    <ListPageLayout
      pagination={{
        limit: data?.pagination.limit ?? 0,
        offset: search.offset,
        onOffsetChange: (offset) => handleSearchChange({ offset }),
        totalItems: data?.pagination.total ?? 0,
      }}
    >
      <PageHeader
        actions={
          <ButtonLinkWithPreload
            hierarchy="neutral"
            kind="ghost"
            to="/production/purposes/archive"
          >
            <ArchiveIcon />
            Archive
          </ButtonLinkWithPreload>
        }
        overline="Production"
        title="Purposes"
      />

      <ProducerPurposeSection
        eserviceId={search.eserviceId}
        isLoading={isLoading}
        onEserviceIdChange={(eserviceId) => {
          if (eserviceId !== search.eserviceId) {
            handleSearchChange({ eserviceId, offset: 0 });
          }
        }}
        purposes={data?.results ?? []}
      />
    </ListPageLayout>
  );
}
