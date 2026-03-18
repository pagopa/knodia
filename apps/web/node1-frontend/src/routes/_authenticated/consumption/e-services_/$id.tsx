import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { bffApi } from "@knodia/bff-client";
import { getConsumerEserviceDetailsOptions } from "@knodia/bff-client/tanstack-query";
import {
  Avatar,
  Banner,
  Breadcrumb,
  Breadcrumbs,
  Button,
  ButtonLink,
  Divider,
  Popover,
} from "@knodia/ui-kit/ui";
import {
  AddressBookIcon,
  SealCheckIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { AttributeGroupContainer } from "@/components/AttributeGroupContainer";
import { PageHeader } from "@/components/PageHeader";
import { CategoryChip } from "@/features/e-service/components/CategoryChip";
import {
  AccessTokenSettingsSection,
  DocumentsSection,
  MaxAPICallsPerDaySection,
  SignalHubSection,
} from "@/features/e-service/components/EserviceDetailSections";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { Section } from "@/features/e-service/components/Section";
import { eserviceDetailSearchSchema } from "@/features/e-service/models/search-params";
import { toConsumptionEserviceDetail } from "@/features/e-service/services/api-converters";
import { client } from "@/libs/axios";
import { downloadResponseAsFile } from "@/utils/downloadFile";

const eserviceQuery = (eserviceId: string, knodeId: bffApi.KnodeId) =>
  getConsumerEserviceDetailsOptions({
    client,
    path: { eserviceId },
    query: { knodeId },
  });

export const Route = createFileRoute(
  "/_authenticated/consumption/e-services_/$id",
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

function ConsumptionRequirementsSection({
  eserviceId,
  hasRequiredAttributes,
  identificationRequired,
  knodeId,
  requiredAttributes,
}: Pick<
  ConsumptionEserviceDetail,
  "hasRequiredAttributes" | "identificationRequired" | "requiredAttributes"
> & { eserviceId: EserviceId; knodeId: KnodeId }) {
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
              {hasRequiredAttributes && (
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
          <Banner kind="neutral">
            {identificationRequired
              ? "Identification required"
              : "Identification not required"}
          </Banner>
        </div>
      </div>
    </Section>
  );
}

function ProducerContactPopover({
  producer,
}: {
  producer: ConsumptionEserviceDetail["producer"];
}) {
  return (
    <DialogTrigger>
      <Button
        aria-label="View producer contact info"
        className="p-0"
        hierarchy="neutral"
        kind="ghost"
        size="icon-sm"
      >
        <AddressBookIcon
          className="text-primary-light-low-contrast"
          size={16}
        />
      </Button>
      <Popover
        className="max-w-md"
        placement="bottom start"
        title={`${producer.name} – ${producer.knodeId}`}
      >
        <dl className="body-sm flex flex-col gap-1">
          <div className="flex gap-2">
            <dt>E-mail address:</dt>
            <dd className="body-sm-em">{producer.email}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Notes:</dt>
            <dd className="body-sm-em">{producer.notes}</dd>
          </div>
        </dl>
      </Popover>
    </DialogTrigger>
  );
}

function RouteComponent() {
  const bffDetail = Route.useLoaderData();
  const { knodeId } = Route.useSearch();
  const eservice = toConsumptionEserviceDetail(bffDetail);

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
          <Avatar
            className="bg-brand-dark text-white"
            fallback={eservice.producer.initials}
            name={eservice.producer.name}
            size="sm"
          />
          <ProducerContactPopover producer={eservice.producer} />
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

      {/* TODO: if an agreement already exists for this eservice, hide ConsumptionRequirementsSection
          and show "Your Org's consumption status" section instead */}
      <ConsumptionRequirementsSection
        eserviceId={eservice.id}
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
