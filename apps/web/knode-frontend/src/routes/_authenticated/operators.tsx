import { useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { OperatorTable } from "@/features/operator/components/OperatorTable";
import {
  operatorsSearchSchema,
  operatorsSearchValues,
} from "@/features/operator/models/search-params";
import { operatorsQuery } from "@/features/operator/services/queries";

const OPERATORS_PAGE_SIZE = 10;

export const Route = createFileRoute("/_authenticated/operators")({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(operatorsQuery());
  },
  search: {
    middlewares: [stripSearchParams(operatorsSearchValues)],
  },
  validateSearch: operatorsSearchSchema,
});

function RouteComponent() {
  const { offset } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: operators, isLoading } = useQuery(operatorsQuery());

  const paginatedOperators =
    operators?.slice(offset, offset + OPERATORS_PAGE_SIZE) ?? [];

  return (
    <ListPageLayout
      pagination={{
        limit: OPERATORS_PAGE_SIZE,
        offset,
        onOffsetChange: (offset) => navigate({ search: { offset } }),
        totalItems: operators?.length ?? 0,
      }}
    >
      <PageHeader title="Operators" />
      <OperatorTable isLoading={isLoading} operators={paginatedOperators} />
    </ListPageLayout>
  );
}
