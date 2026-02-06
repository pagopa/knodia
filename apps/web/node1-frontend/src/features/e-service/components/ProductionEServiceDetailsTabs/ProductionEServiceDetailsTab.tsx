import { Banner, Divider } from "@knodia/ui-kit/ui";

import { GenericInfoCard } from "@/components/GenericInfoCard";
import { SettingsCard } from "@/components/SettingCard";

import { Section } from "./Section";

export function ProductionEServiceDetailsTab() {
  return (
    <>
      <ConsumptionRequirementsSection />
      <Divider className="my-10" />
      <DocumentsSection />
      <Divider className="my-10" />
      <AccessTokenSettingsSection />
      <Divider className="my-10" />
      <MaxAPICallsPerDaySection />
      <Divider className="my-10" />
      <SignalHubSection />
    </>
  );
}

function AccessTokenSettingsSection() {
  return (
    <Section className="grid grid-cols-3 gap-4" title="Access token settings">
      <SettingsCard label="Duration">30 minutes</SettingsCard>
      <SettingsCard label="Audience">www.rigel.orion/residence/v1</SettingsCard>
      <SettingsCard label="Type">Bearer</SettingsCard>
    </Section>
  );
}

function ConsumptionRequirementsSection() {
  return (
    <Section
      className="grid grid-cols-2 gap-10"
      title="Consumption requirements"
    >
      <div>
        <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
          Attributes
        </h3>
        <ul className="gap-2 flex flex-col" role="list">
          <li>
            <GenericInfoCard label="Attribute 1">-</GenericInfoCard>
          </li>
          <li>
            <GenericInfoCard label="Attribute 2">-</GenericInfoCard>
          </li>
          <li>
            <GenericInfoCard label="Attribute 3">-</GenericInfoCard>
          </li>
        </ul>
      </div>
      <div>
        <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
          Identification
        </h3>
        <Banner kind="informative">Identification required</Banner>
      </div>
    </Section>
  );
}

function DocumentsSection() {
  return <Section title="Documents"></Section>;
}

function MaxAPICallsPerDaySection() {
  return (
    <Section className="grid grid-cols-2 gap-4" title="Max API calls per day">
      <SettingsCard label="Per Knode">10.000</SettingsCard>
      <SettingsCard label="Per Consumer">1.000</SettingsCard>
    </Section>
  );
}

function SignalHubSection() {
  return (
    <Section title="Signal hub">
      <p className="body-lg text-primary-dark">
        This E-Service is available on Signal Hub.
      </p>
    </Section>
  );
}
