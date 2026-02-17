import { Banner, Divider } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

import { CopyableValueField } from "@/components/CopyableValueField";
import { SettingsCard } from "@/components/SettingCard";

import { useProductionEserviceDetailsContext } from "../../contexts/useProductionEserviceDetailsContext";
import { AttributeGroupContainer } from "../AttributeGroupContainer";
import { DocumentRecap } from "../DocumentRecap";
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
    <Section title="Access token settings">
      <div className="grid grid-cols-3 gap-4">
        <SettingsCard label="Duration">30 minutes</SettingsCard>
        <SettingsCard label="Audience">
          www.rigel.orion/residence/v1
        </SettingsCard>
        <SettingsCard label="Type">Bearer</SettingsCard>
      </div>
    </Section>
  );
}

function ConsumptionRequirementsSection() {
  return (
    <Section title="Consumption requirements">
      <div className="grid grid-cols-2 gap-10">
        <div>
          <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
            Attributes
          </h3>
          <ul className="gap-2 flex flex-col" role="list">
            <li>
              <AttributeGroupContainer
                attributes={[
                  { code: "NUTS1", scheme: "vc_territorial_units" },
                  { code: "NUTS2", scheme: "vc_territorial_units" },
                ]}
              />
            </li>
            <li>
              <AttributeGroupContainer
                attributes={[{ code: "NUTS3", scheme: "vc_territorial_units" }]}
              />
            </li>
            <li>
              <AttributeGroupContainer
                attributes={[{ code: "NUTS4", scheme: "vc_territorial_units" }]}
              />
            </li>
          </ul>
        </div>
        <div>
          <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
            Identification
          </h3>
          <Banner kind="informative">Identification required</Banner>
        </div>
      </div>
    </Section>
  );
}

function DocumentsSection() {
  return (
    <Section title="Documents">
      <DocumentRecap name="Api Specs" showDownloadButton />
      <CopyableValueField
        className="mt-6"
        label="Checksum:"
        value="3f653f35f8311c870e209cc672dfc3698081eefe84cc40f1af5bd61db2c54287D"
      />
    </Section>
  );
}

function MaxAPICallsPerDaySection() {
  return (
    <Section title="Max API calls per day">
      <div className="grid grid-cols-2 gap-4">
        <SettingsCard label="Per Knode">10.000</SettingsCard>
        <SettingsCard label="Per Consumer">1.000</SettingsCard>
      </div>
    </Section>
  );
}

function SignalHubSection() {
  const { eservice } = useProductionEserviceDetailsContext();

  return (
    <Section className="mb-6" title="Signal hub">
      <p className="body-lg text-primary-dark">
        {match(eservice)
          .with(
            { isSignalHubEnabled: true },
            () => "This E-Service is available on Signal Hub.",
          )
          .with(
            { isSignalHubEnabled: false },
            () => "This E-Service is not available on Signal Hub.",
          )
          .exhaustive()}
      </p>
    </Section>
  );
}
