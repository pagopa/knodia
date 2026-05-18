import {
  type EserviceId,
  KnodeId,
  type PurposeTemplateId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { type QueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { toConsumptionEserviceDetail } from "@/features/e-service/services/api-converters";
import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { ChooseTemplateModal } from "@/features/purpose/components/ChooseTemplateModal/ChooseTemplateModal";
import { CreatePurposeModal } from "@/features/purpose/components/CreatePurposeModal/CreatePurposeModal";
import {
  purposeTemplateDetailsQuery,
  purposeTemplatesQuery,
} from "@/features/purpose/services/queries";
import { requireRole } from "@/libs/routeGuards";

const searchSchema = z.object({
  knodeId: KnodeId,
  templateId: z.uuid().optional().catch(undefined),
});

export const Route = createFileRoute(
  "/_authenticated/consumption/e-services/$id_/purposes/from-template",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { knodeId, templateId } }) => ({
    knodeId,
    templateId,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: async ({
    context,
    deps: { knodeId, templateId },
    params: { id },
  }) => {
    requireRole(context, "administrative");
    const eserviceId = unsafeBrandId<EserviceId>(id);
    const eserviceDetail = await context.queryClient.ensureQueryData(
      consumerEserviceDetailsQuery(id, knodeId),
    );
    // Template flow only applies to ProvideData E-services. Direct URL hits
    // on a ReceiveData E-service silently degrade to the from-scratch form.
    if (eserviceDetail.mode !== "ProvideData") {
      throw redirect({
        params: { id },
        replace: true,
        search: { knodeId },
        to: "/consumption/e-services/$id/purposes/new",
      });
    }

    const templateDetail = templateId
      ? await loadTemplateDetail({
          eserviceId,
          id,
          knodeId,
          queryClient: context.queryClient,
          templateId,
        })
      : undefined;

    return { eserviceDetail, templateDetail };
  },
  validateSearch: searchSchema,
});

async function loadTemplateDetail({
  eserviceId,
  id,
  knodeId,
  queryClient,
  templateId,
}: {
  eserviceId: EserviceId;
  id: string;
  knodeId: KnodeId;
  queryClient: QueryClient;
  templateId: string;
}) {
  // The detail endpoint validates only templateId + knodeId, not eserviceId,
  // so we re-check membership in the scoped list before fetching details.
  const availableTemplates = await queryClient.ensureQueryData(
    purposeTemplatesQuery(knodeId, eserviceId),
  );
  if (!availableTemplates.some((t) => t.id === templateId)) {
    throw redirect({
      params: { id },
      replace: true,
      search: { knodeId },
      to: "/consumption/e-services/$id/purposes/new",
    });
  }
  return queryClient.ensureQueryData(
    purposeTemplateDetailsQuery(
      unsafeBrandId<PurposeTemplateId>(templateId),
      knodeId,
    ),
  );
}

function RouteComponent() {
  const { eserviceDetail, templateDetail } = Route.useLoaderData();
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

  if (templateDetail) {
    return (
      <CreatePurposeModal
        eservice={eservice}
        initialTemplate={templateDetail}
        knodeId={knodeId}
        onClose={onClose}
      />
    );
  }

  return (
    <ChooseTemplateModal
      eserviceId={eservice.id}
      knodeId={knodeId}
      onClose={onClose}
      onTemplateSelected={(selectedId) =>
        navigate({
          params: { id },
          replace: true,
          search: { knodeId, templateId: selectedId },
          to: "/consumption/e-services/$id/purposes/from-template",
        })
      }
    />
  );
}
