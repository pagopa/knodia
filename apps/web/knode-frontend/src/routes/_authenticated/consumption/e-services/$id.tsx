import { bffApi } from "@knodia/bff-client";
import { Breadcrumb, Breadcrumbs, Divider } from "@knodia/ui-kit/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { KnodeAvatar } from "@/components/KnodeAvatar";
import { OrganizationContactPopover } from "@/components/OrganizationContactPopover";
import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { CategoryChip } from "@/features/e-service/components/CategoryChip";
import { ConsumptionRequirementsSection } from "@/features/e-service/components/ConsumptionRequirementsSection";
import {
  AccessTokenSettingsSection,
  DocumentsSection,
  MaxAPICallsPerDaySection,
  SignalHubSection,
} from "@/features/e-service/components/EserviceDetailSections";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { OrgConsumptionStatusSection } from "@/features/e-service/components/OrgConsumptionStatusSection";
import { eserviceDetailSearchSchema } from "@/features/e-service/models/search-params";
import { toConsumptionEserviceDetail } from "@/features/e-service/services/api-converters";
import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { client } from "@/libs/axios";
import { downloadResponseAsFile } from "@/utils/downloadFile";

export const Route = createFileRoute(
  "/_authenticated/consumption/e-services/$id",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { knodeId } }) => ({ knodeId }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { knodeId }, params: { id } }) =>
    queryClient.ensureQueryData(consumerEserviceDetailsQuery(id, knodeId)),
  validateSearch: eserviceDetailSearchSchema,
});

function RouteComponent() {
  const canManageAgreements = useHasRole("administrative");
  const { knodeId } = Route.useSearch();
  const { id } = Route.useParams();
  const { data: bffDetail } = useSuspenseQuery(
    consumerEserviceDetailsQuery(id, knodeId),
  );
  const eservice = toConsumptionEserviceDetail(bffDetail);
  const { agreement } = eservice;
  const hasAgreement =
    agreement !== undefined && agreement.state !== "Archived";

  async function downloadInterfaceDocument() {
    const response = await bffApi.getConsumerEserviceLatestVersionInterface({
      client,
      path: { eserviceId: bffDetail.id },
      query: { knodeId },
    });

    downloadResponseAsFile({
      contentDisposition: response.headers["content-disposition"],
      contentType: response.headers["content-type"],
      data: response.data,
    });
  }

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Consumption</Breadcrumb>
        <Breadcrumb href={{ to: "/consumption/e-services" }}>
          E-Services
        </Breadcrumb>
        <Breadcrumb>{eservice.name}</Breadcrumb>
      </Breadcrumbs>

      <PageHeader
        resourceStatusChip={
          eservice.state === "Archived" ? (
            <EserviceStateChip
              archivedAt={eservice.latestVersionUpdatedAt}
              state="Archived"
            />
          ) : (
            <EserviceStateChip state={eservice.state} />
          )
        }
        title={eservice.name}
      >
        <div className="flex items-center gap-3 mt-3">
          <KnodeAvatar
            className="bg-brand-dark text-white"
            knodeId={eservice.producer.knodeId}
            name={eservice.producer.name}
            size="sm"
          />
          <OrganizationContactPopover organization={eservice.producer} />
        </div>
        <p className="mt-6 body-md text-primary-light-low-contrast max-w-160">
          {eservice.description}
        </p>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <EserviceModeChip mode={eservice.mode} />
        {eservice.categories.map((category) => (
          <CategoryChip
            code={category.code}
            key={category.code}
            scheme={category.scheme}
          />
        ))}
      </div>

      {agreement && (
        <div className="mt-10">
          <OrgConsumptionStatusSection
            agreement={agreement}
            eserviceId={eservice.id}
            eserviceMode={eservice.mode}
            eserviceState={eservice.state}
            hasRecentlyBeenUpdated={eservice.hasRecentlyBeenUpdated}
            knodeId={knodeId}
          />
        </div>
      )}
      <Divider className="my-10" />
      <ConsumptionRequirementsSection
        canRequestAgreement={canManageAgreements}
        eserviceId={eservice.id}
        eserviceState={eservice.state}
        hasAgreement={hasAgreement}
        hasRequiredAttributes={eservice.hasRequiredAttributes}
        identificationRequired={eservice.identificationRequired}
        knodeId={knodeId}
        requiredAttributes={eservice.requiredAttributes}
      />

      <Divider className="my-10" />

      <DocumentsSection
        checksum={eservice.interfaceDocument.checksum}
        name={eservice.interfaceDocument.name}
        onDownload={downloadInterfaceDocument}
      />

      <Divider className="my-10" />

      <AccessTokenSettingsSection
        audience={eservice.accessToken.audience.join(", ")}
        durationInMinutes={eservice.accessToken.durationInMinutes}
        type={eservice.accessToken.type}
      />

      <Divider className="my-10" />

      <MaxAPICallsPerDaySection
        perConsumer={eservice.maxDailyCalls.perConsumer}
        perKnode={eservice.maxDailyCalls.perKnode}
      />

      <Divider className="my-10" />

      <SignalHubSection isSignalHubEnabled={eservice.isSignalHubEnabled} />
    </>
  );
}
