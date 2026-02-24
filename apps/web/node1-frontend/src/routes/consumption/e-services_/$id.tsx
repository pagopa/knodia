import {
  Avatar,
  Banner,
  Breadcrumb,
  Breadcrumbs,
  Button,
  Divider,
} from "@knodia/ui-kit/ui";
import { AddressBookIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { match } from "ts-pattern";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { CopyableValueField } from "@/components/CopyableValueField";
import { PageHeader } from "@/components/PageHeader";
import { SettingsCard } from "@/components/SettingCard";
import { AttributeGroupContainer } from "@/features/e-service/components/AttributeGroupContainer";
import { DocumentRecap } from "@/features/e-service/components/DocumentRecap";
import { CategoryChip } from "@/features/e-service/components/EserviceCard";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { Section } from "@/features/e-service/components/Section";
import { mockConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail.mock";
import { formatNumber } from "@/utils/formatters";

export const Route = createFileRoute("/consumption/e-services_/$id")({
  component: RouteComponent,
});

function AccessTokenSettingsSection({
  eservice,
}: {
  eservice: ConsumptionEserviceDetail;
}) {
  return (
    <Section title="Access token settings">
      <div className="grid grid-cols-3 gap-4">
        <SettingsCard label="Duration">
          {eservice.accessToken.duration} minutes
        </SettingsCard>
        <SettingsCard label="Audience">
          {eservice.accessToken.audience}
        </SettingsCard>
        <SettingsCard label="Type">{eservice.accessToken.type}</SettingsCard>
      </div>
    </Section>
  );
}

function ConsumptionRequirementsSection({
  eservice,
}: {
  eservice: ConsumptionEserviceDetail;
}) {
  const { hasRequiredAttributes, identificationRequired, requiredAttributes } =
    eservice;

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

      <div className="mt-6">
        <Banner kind={hasRequiredAttributes ? "success" : "warning"}>
          {hasRequiredAttributes
            ? "Your organization has the required attributes to request an agreement."
            : "Your organization does not have the required attributes to request an agreement."}
        </Banner>
      </div>

      <div className="mt-6">
        <Button
          hierarchy="brand"
          isDisabled={!hasRequiredAttributes}
          kind="filled"
          size="md"
        >
          Request Agreement
        </Button>
      </div>
    </Section>
  );
}

function DocumentsSection({
  eservice,
}: {
  eservice: ConsumptionEserviceDetail;
}) {
  return (
    <Section title="Documents">
      <DocumentRecap name={eservice.interfaceDocument.name} />
      <CopyableValueField
        className="mt-6"
        label="Checksum:"
        value={eservice.interfaceDocument.checksum}
      />
    </Section>
  );
}

function MaxAPICallsPerDaySection({
  eservice,
}: {
  eservice: ConsumptionEserviceDetail;
}) {
  return (
    <Section title="Max API calls per day">
      <div className="grid grid-cols-2 gap-4">
        <SettingsCard label="Per Knode">
          {formatNumber(eservice.maxDailyCalls.perKnode)}
        </SettingsCard>
        <SettingsCard label="Per Consumer">
          {formatNumber(eservice.maxDailyCalls.perConsumer)}
        </SettingsCard>
      </div>
    </Section>
  );
}

function RouteComponent() {
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
            size="sm"
          />
          <span className="body-md text-primary-light-high-contrast">
            {eservice.producer.name}
          </span>
          <AddressBookIcon
            className="text-primary-light-low-contrast"
            size={16}
          />
        </div>
        <p className="mt-6 body-md text-primary-light-low-contrast max-w-160">
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
          />
        ))}
      </div>

      <Divider className="my-10" />

      <ConsumptionRequirementsSection eservice={eservice} />

      <Divider className="my-10" />

      <DocumentsSection eservice={eservice} />

      <Divider className="my-10" />

      <AccessTokenSettingsSection eservice={eservice} />

      <Divider className="my-10" />

      <MaxAPICallsPerDaySection eservice={eservice} />

      <Divider className="my-10" />

      <SignalHubSection eservice={eservice} />
    </>
  );
}

function SignalHubSection({
  eservice,
}: {
  eservice: ConsumptionEserviceDetail;
}) {
  return (
    <Section className="mb-6" title="Signal hub">
      <p className="body-lg text-primary-dark">
        {match(eservice.isSignalHubEnabled)
          .with(true, () => "This E-Service is available on Signal Hub.")
          .with(false, () => "This E-Service is not available on Signal Hub.")
          .exhaustive()}
      </p>
    </Section>
  );
}
