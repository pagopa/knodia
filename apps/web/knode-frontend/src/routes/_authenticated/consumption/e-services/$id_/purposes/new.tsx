import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { eserviceDetailSearchSchema } from "@/features/e-service/models/search-params";
import { toConsumptionEserviceDetail } from "@/features/e-service/services/api-converters";
import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { CreatePurposeModal } from "@/features/purpose/components/CreatePurposeModal/CreatePurposeModal";
import { requireRole } from "@/libs/routeGuards";

export const Route = createFileRoute(
  "/_authenticated/consumption/e-services/$id_/purposes/new",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { knodeId } }) => ({ knodeId }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: async ({ context, deps: { knodeId }, params: { id } }) => {
    requireRole(context, "administrative");
    const eserviceDetail = await context.queryClient.ensureQueryData(
      consumerEserviceDetailsQuery(id, knodeId),
    );
    return { eserviceDetail };
  },
  validateSearch: eserviceDetailSearchSchema,
});

function RouteComponent() {
  const { eserviceDetail } = Route.useLoaderData();
  const { knodeId } = Route.useSearch();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const eservice = toConsumptionEserviceDetail(eserviceDetail);

  const onClose = () =>
    navigate({
      params: { id },
      replace: true,
      search: { knodeId },
      to: "/consumption/e-services/$id",
    });

  return (
    <CreatePurposeModal
      eservice={eservice}
      knodeId={knodeId}
      onClose={onClose}
    />
  );
}
