import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { RequestAgreementModal } from "@/features/agreement/components/RequestAgreementModal/RequestAgreementModal";
import { requestAgreementSearchSchema } from "@/features/agreement/models/search-params";
import { toConsumptionEserviceDetail } from "@/features/e-service/services/api-converters";
import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";

export const Route = createFileRoute(
  "/_authenticated/consumption/e-services_/request-agreement/",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { eserviceId, knodeId } }) => ({
    eserviceId,
    knodeId,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: async ({ context: { queryClient }, deps: { eserviceId, knodeId } }) =>
    await queryClient.ensureQueryData(
      consumerEserviceDetailsQuery(eserviceId, knodeId),
    ),
  validateSearch: requestAgreementSearchSchema,
});

function RouteComponent() {
  const bffDetail = Route.useLoaderData();
  const { eserviceId, knodeId } = Route.useSearch();
  const eservice = toConsumptionEserviceDetail(bffDetail);
  const navigate = useNavigate();

  const onClose = () =>
    navigate({
      params: { id: eserviceId },
      search: { knodeId },
      to: "/consumption/e-services/$id",
    });

  return (
    <RequestAgreementModal
      eservice={eservice}
      knodeId={knodeId}
      onClose={onClose}
    />
  );
}
