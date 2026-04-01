import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { bffApi } from "@knodia/bff-client";
import {
  Banner,
  Breadcrumb,
  Breadcrumbs,
  ButtonLink,
  Divider,
} from "@knodia/ui-kit/ui";
import { SealCheckIcon, WarningIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { AttributeGroupContainer } from "@/components/AttributeGroupContainer";
import { KnodeAvatar } from "@/components/KnodeAvatar";
import { OrganizationContactPopover } from "@/components/OrganizationContactPopover";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { useHasRole } from "@/contexts/auth";
import { CategoryChip } from "@/features/e-service/components/CategoryChip";
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
  loader: async ({
    context: { queryClient },
    deps: { knodeId },
    params: { id },
  }) =>
    await queryClient.ensureQueryData(
      consumerEserviceDetailsQuery(id, knodeId),
    ),
  validateSearch: eserviceDetailSearchSchema,
});

function ConsumptionRequirementsSection({
  canRequestAgreement,
  eserviceId,
  hasAgreement,
  hasRequiredAttributes,
  identificationRequired,
  knodeId,
  requiredAttributes,
}: Pick<
  ConsumptionEserviceDetail,
  "hasRequiredAttributes" | "identificationRequired" | "requiredAttributes"
> & {
  canRequestAgreement: boolean;
  eserviceId: EserviceId;
  hasAgreement: boolean;
  knodeId: KnodeId;
}) {
  return (
    <Section title="Consumption requirements">
      <div className="grid grid-cols-2 gap-10">
        <div>
          <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
            Attributes
          </h3>
          {requiredAttributes.length > 0 && (
            <ul className="gap-2 flex flex-col mb-6" role="list">
              {requiredAttributes.map((group, index) => (
                <li key={index}>
                  <AttributeGroupContainer attributes={group} />
                </li>
              ))}
            </ul>
          )}

          <Banner
            className="[&>div:last-child]:flex-1"
            icon={hasRequiredAttributes ? <SealCheckIcon /> : <WarningIcon />}
            kind={hasRequiredAttributes ? "neutral" : "warning"}
          >
            <div className="flex items-center justify-between gap-4">
              <span>
                {hasRequiredAttributes
                  ? "Your organization has the required attributes."
                  : "Your organization does not have the required attributes."}
              </span>
              {canRequestAgreement &&
                hasRequiredAttributes &&
                !hasAgreement && (
                  <ButtonLink
                    className="shrink-0"
                    hierarchy="brand"
                    href={{
                      search: { eserviceId, knodeId },
                      to: "/consumption/e-services/request-agreement",
                    }}
                    kind="filled"
                    size="md"
                  >
                    Request Agreement
                  </ButtonLink>
                )}
            </div>
          </Banner>
        </div>

        <div>
          <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
            Identification
          </h3>
          {identificationRequired ? (
            <Banner kind="informative">Identification required</Banner>
          ) : (
            <Banner kind="neutral">Identification not required</Banner>
          )}
        </div>
      </div>
    </Section>
  );
}

function RouteComponent() {
  const canManageAgreements = useHasRole("administrative");
  const bffDetail = Route.useLoaderData();
  const { knodeId } = Route.useSearch();
  const eservice = toConsumptionEserviceDetail(bffDetail);
  const { agreement } = eservice;
  const hasAgreement = agreement !== undefined;

  async function downloadInterfaceDocument() {
    const response = await bffApi.getConsumerEserviceLatestVersionInterface({
      client,
      path: { eserviceId: bffDetail.id },
      query: { knodeId },
    });

    downloadResponseAsFile(
      response.data,
      eservice.interfaceDocument.name,
      response.headers["content-type"],
    );
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
        resourceStatusChip={<EserviceStateChip state={eservice.state} />}
        title={eservice.name}
      >
        <div className="flex items-center gap-3 mt-3">
          <KnodeAvatar
            className="bg-brand-dark text-white"
            knodeId={eservice.producer.knodeId}
            name={eservice.producer.name}
            size="sm"
          />
          <OrganizationContactPopover
            email={eservice.producer.email}
            knodeId={eservice.producer.knodeId}
            name={eservice.producer.name}
            notes={eservice.producer.notes}
          />
        </div>
        <p className="mt-6 body-md text-primary-light-low-contrast max-w-200">
          {eservice.description}
        </p>
      </PageHeader>

      <div className="flex gap-2">
        <EserviceModeChip mode={eservice.mode} />
        {eservice.categories.map((category) => (
          <CategoryChip
            code={category.code}
            key={category.code}
            scheme={category.scheme}
            showIcon={false}
          />
        ))}
      </div>

      <Divider className="my-10" />

      {agreement && (
        <>
          <OrgConsumptionStatusSection
            agreement={agreement}
            eserviceId={eservice.id}
            knodeId={knodeId}
          />
          <Divider className="my-10" />
        </>
      )}
      <ConsumptionRequirementsSection
        canRequestAgreement={canManageAgreements}
        eserviceId={eservice.id}
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
