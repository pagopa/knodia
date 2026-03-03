import type { bffApi } from "@knodia/bff-client";

import { getConsumerCatalogEserviceDetailOptions } from "@knodia/bff-client/tanstack-query";
import {
  Avatar,
  Banner,
  Breadcrumb,
  Breadcrumbs,
  Button,
  Divider,
  Popover,
} from "@knodia/ui-kit/ui";
import { AddressBookIcon, SealCheckIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { PageHeader } from "@/components/PageHeader";
import { AttributeGroupContainer } from "@/features/e-service/components/AttributeGroupContainer";
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

const eserviceQuery = (eserviceId: string, knodeId: string) =>
  getConsumerCatalogEserviceDetailOptions({
    client,
    path: { eserviceId },
    query: { knodeId: knodeId as bffApi.KnodeId },
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
  identificationRequired,
  requiredAttributes,
}: Pick<
  ConsumptionEserviceDetail,
  "identificationRequired" | "requiredAttributes"
>) {
  const hasRequiredAttributes =
    requiredAttributes.length > 0 &&
    requiredAttributes.every((group) => group.some((attr) => attr.possessed));
  return (
    <Section title="Consumption requirements">
      <div className="grid grid-cols-2 gap-10">
        <div>
          <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
            Attributes
          </h3>
          <ul className="gap-2 flex flex-col" role="list">
            {requiredAttributes.map((group, index) => (
              <li key={index}>
                <AttributeGroupContainer attributes={group} />
              </li>
            ))}
          </ul>

          {/* TODO: "Request Agreement" button behavior:
              - Has required attributes + e-service available: redirect to Request Agreement flow
              - Has required attributes + e-service unavailable: show message that user can't proceed
              - Lacks required attributes: show informative message (button already disabled) */}
          <Banner
            className="mt-6 [&>div:last-child]:flex-1"
            icon={<SealCheckIcon />}
            kind="neutral"
          >
            <div className="flex items-center justify-between gap-4">
              <span>
                {hasRequiredAttributes
                  ? "Your organization has the required attributes."
                  : "Your organization does not have the required attributes."}
              </span>
              <Button
                className="shrink-0"
                hierarchy="brand"
                isDisabled={!hasRequiredAttributes}
                kind="filled"
                size="md"
              >
                Request Agreement
              </Button>
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
        title={`${producer.name} – ${producer.knodeName}`}
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
  const eservice = toConsumptionEserviceDetail(bffDetail);

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

      <ConsumptionRequirementsSection
        identificationRequired={eservice.identificationRequired}
        requiredAttributes={eservice.requiredAttributes}
      />

      <Divider className="my-10" />

      <DocumentsSection
        checksum={eservice.interfaceDocument.checksum}
        name={eservice.interfaceDocument.name}
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
