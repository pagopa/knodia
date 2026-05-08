import {
  type EserviceId,
  type PurposeTemplateId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { createPurposeSearchSchema } from "@/features/e-service/models/search-params";
import { toConsumptionEserviceDetail } from "@/features/e-service/services/api-converters";
import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { ChooseTemplateModal } from "@/features/purpose/components/ChooseTemplateModal/ChooseTemplateModal";
import { CreatePurposeModal } from "@/features/purpose/components/CreatePurposeModal/CreatePurposeModal";
import {
  purposeTemplateDetailsQuery,
  purposeTemplatesQuery,
} from "@/features/purpose/services/queries";
import { requireRole } from "@/libs/routeGuards";

export const Route = createFileRoute(
  "/_authenticated/consumption/e-services/$id_/purposes/new",
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
    const eserviceDetail = await context.queryClient.ensureQueryData(
      consumerEserviceDetailsQuery(id, knodeId),
    );
    // Fall back to the from-scratch flow if the templateId does not resolve
    // to a template valid for this E-service and form schema version
    // (stale bookmark, removed template, manual URL tampering, mismatched
    // E-service or schema). The list endpoint applies those availability
    // constraints server-side, so a template present in the list is safe to
    // pre-fill. Transient query failures are not swallowed — they propagate
    // to the route error boundary instead of silently degrading to from-scratch.
    let templateDetail;
    if (templateId) {
      const availableTemplates = await context.queryClient.ensureQueryData(
        purposeTemplatesQuery(knodeId, unsafeBrandId<EserviceId>(id)),
      );
      if (availableTemplates.some((t) => t.id === templateId)) {
        templateDetail = await context.queryClient.ensureQueryData(
          purposeTemplateDetailsQuery(
            unsafeBrandId<PurposeTemplateId>(templateId),
            knodeId,
          ),
        );
      }
    }
    return { eserviceDetail, templateDetail };
  },
  validateSearch: createPurposeSearchSchema,
});

function RouteComponent() {
  const { eserviceDetail, templateDetail } = Route.useLoaderData();
  const { from, knodeId, templateId } = Route.useSearch();
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

  if (from === "template" && !templateId) {
    return (
      <ChooseTemplateModal
        eserviceId={eservice.id}
        knodeId={knodeId}
        onClose={onClose}
        onTemplateSelected={(template) =>
          navigate({
            params: { id },
            replace: true,
            search: { knodeId, templateId: template.id },
            to: "/consumption/e-services/$id/purposes/new",
          })
        }
      />
    );
  }

  return (
    <CreatePurposeModal
      eservice={eservice}
      initialTemplate={templateDetail}
      knodeId={knodeId}
      onClose={onClose}
    />
  );
}
