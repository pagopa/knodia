import { bffApi } from "@knodia/bff-client";
import { getConsumerEserviceDetailsOptions } from "@knodia/bff-client/tanstack-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { RequestAgreementModal } from "@/features/e-service/components/RequestAgreementModal/RequestAgreementModal";
import { requestAgreementSearchSchema } from "@/features/e-service/models/search-params";
import { toConsumptionEserviceDetail } from "@/features/e-service/services/api-converters";
import { client } from "@/libs/axios";

const eserviceQuery = (eserviceId: string, knodeId: bffApi.KnodeId) =>
  getConsumerEserviceDetailsOptions({
    client,
    path: { eserviceId },
    query: { knodeId },
  });

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
    await queryClient.ensureQueryData(eserviceQuery(eserviceId, knodeId)),
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
