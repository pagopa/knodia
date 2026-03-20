import type { KnodeId } from "@knodia/common-models/ids";

import { getConsumerEserviceDetailsOptions } from "@knodia/bff-client/tanstack-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { eserviceDetailSearchSchema } from "@/features/e-service/models/search-params";
import { toConsumptionEserviceDetail } from "@/features/e-service/services/api-converters";
import { CreatePurposeModal } from "@/features/purpose/components/CreatePurposeModal/CreatePurposeModal";
import { client } from "@/libs/axios";

const eserviceQuery = (eserviceId: string, knodeId: KnodeId) =>
  getConsumerEserviceDetailsOptions({
    client,
    path: { eserviceId },
    query: { knodeId },
  });

export const Route = createFileRoute(
  "/_authenticated/consumption/e-services_/$id_/purposes/new",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { knodeId } }) => ({ knodeId }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: async ({
    context: { queryClient },
    deps: { knodeId },
    params: { id },
  }) => await queryClient.ensureQueryData(eserviceQuery(id, knodeId)),
  validateSearch: eserviceDetailSearchSchema,
});

function RouteComponent() {
  const bffDetail = Route.useLoaderData();
  const { knodeId } = Route.useSearch();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const eservice = toConsumptionEserviceDetail(bffDetail);

  const onClose = () =>
    navigate({
      params: { id },
      replace: true,
      search: { knodeId },
      to: "/consumption/e-services/$id",
    });

  return (
    <CreatePurposeModal
      eserviceId={eservice.id}
      eserviceName={eservice.name}
      knodeId={knodeId}
      onClose={onClose}
    />
  );
}
