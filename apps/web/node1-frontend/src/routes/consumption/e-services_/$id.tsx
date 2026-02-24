import {
  Avatar,
  Banner,
  Breadcrumb,
  Breadcrumbs,
  Button,
  Divider,
} from "@knodia/ui-kit/ui";
import { AddressBookIcon, SealCheckIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { CopyableValueField } from "@/components/CopyableValueField";
import { PageHeader } from "@/components/PageHeader";
import { SettingsCard } from "@/components/SettingCard";
import { AttributeGroupContainer } from "@/features/e-service/components/AttributeGroupContainer";
import { CategoryChip } from "@/features/e-service/components/CategoryChip";
import { DocumentRecap } from "@/features/e-service/components/DocumentRecap";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { Section } from "@/features/e-service/components/Section";
import { mockConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail.mock";
import { formatNumber } from "@/utils/formatters";

export const Route = createFileRoute("/consumption/e-services_/$id")({
  component: RouteComponent,
  // TODO: Add loader to fetch consumption e-service detail from BFF
});

function AccessTokenSettingsSection({
  accessToken,
}: {
  accessToken: ConsumptionEserviceDetail["accessToken"];
}) {
  return (
    <Section title="Access token settings">
      <div className="grid grid-cols-3 gap-4">
        <SettingsCard label="Duration">
          {accessToken.durationInMinutes} minutes
        </SettingsCard>
        <SettingsCard label="Audience">{accessToken.audience}</SettingsCard>
        <SettingsCard label="Type">{accessToken.type}</SettingsCard>
      </div>
    </Section>
  );
}

function ConsumptionRequirementsSection({
  hasRequiredAttributes,
  identificationRequired,
  requiredAttributes,
}: Pick<
  ConsumptionEserviceDetail,
  "hasRequiredAttributes" | "identificationRequired" | "requiredAttributes"
>) {
  return (
    <Section title="Consumption requirements">
      <div className="grid grid-cols-2 gap-10">
        <div>
          <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
            Attributes
          </h3>
          {/* TODO: Attributes that the organization possesses should be displayed in bold */}
          <ul className="gap-2 flex flex-col" role="list">
            {requiredAttributes.map((group, index) => (
              <li key={index}>
                <AttributeGroupContainer
                  attributes={group}
                  verified={hasRequiredAttributes}
                />
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

function DocumentsSection({
  interfaceDocument,
}: {
  interfaceDocument: ConsumptionEserviceDetail["interfaceDocument"];
}) {
  return (
    <Section title="Documents">
      {/* TODO: Add onDownload handler once the BFF endpoint is available */}
      <DocumentRecap name={interfaceDocument.name} showDownloadButton />
      <CopyableValueField
        className="mt-6"
        label="Checksum:"
        value={interfaceDocument.checksum}
      />
    </Section>
  );
}

function MaxAPICallsPerDaySection({
  maxDailyCalls,
}: {
  maxDailyCalls: ConsumptionEserviceDetail["maxDailyCalls"];
}) {
  return (
    <Section title="Max API calls per day">
      <div className="grid grid-cols-2 gap-4">
        <SettingsCard label="Per Knode">
          {formatNumber(maxDailyCalls.perKnode)}
        </SettingsCard>
        <SettingsCard label="Per Consumer">
          {formatNumber(maxDailyCalls.perConsumer)}
        </SettingsCard>
      </div>
    </Section>
  );
}

function RouteComponent() {
  // TODO: Use Route.useParams() to fetch consumption e-service detail once the BFF endpoint is available
  const eservice = mockConsumptionEserviceDetail;

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
          {/* TODO: AddressBookIcon click does nothing yet — producer organization data is not available from BE (see Figma comments) */}
          <AddressBookIcon
            className="text-primary-light-low-contrast"
            size={16}
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

      <ConsumptionRequirementsSection
        hasRequiredAttributes={eservice.hasRequiredAttributes}
        identificationRequired={eservice.identificationRequired}
        requiredAttributes={eservice.requiredAttributes}
      />

      <Divider className="my-10" />

      <DocumentsSection interfaceDocument={eservice.interfaceDocument} />

      <Divider className="my-10" />

      <AccessTokenSettingsSection accessToken={eservice.accessToken} />

      <Divider className="my-10" />

      <MaxAPICallsPerDaySection maxDailyCalls={eservice.maxDailyCalls} />

      <Divider className="my-10" />

      <SignalHubSection isSignalHubEnabled={eservice.isSignalHubEnabled} />
    </>
  );
}

function SignalHubSection({
  isSignalHubEnabled,
}: {
  isSignalHubEnabled: boolean;
}) {
  return (
    <Section className="mb-6" title="Signal hub">
      <p className="body-lg text-primary-dark">
        {isSignalHubEnabled
          ? "This E-Service is available on Signal Hub."
          : "This E-Service is not available on Signal Hub."}
      </p>
    </Section>
  );
}
